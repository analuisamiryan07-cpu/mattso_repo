import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { validateEnv } from './common/env.validation';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';

// JSON.stringify no sabe serializar BigInt (los IDs de public.* lo son). Las rutas
// del LMS devuelven filas de Prisma directamente (p.ej. courses.profesor_usuario_id),
// y sin esto responden 500. Los IDs son autoincrementales pequeños, sin pérdida al pasar a Number.
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function (this: bigint) {
  return Number(this);
};

async function bootstrap() {
  // Antes de crear la app: si falta un secreto crítico, no arrancar.
  validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bodyParser: true,
  });
  const logger = new Logger('Bootstrap');

  // Render (y cualquier PaaS) pone un proxy delante. Sin esto, req.ip es la IP
  // del proxy y el rate limiting trata a TODOS los usuarios como uno solo.
  // "1" = confiar solo en el primer salto, no en cabeceras X-Forwarded-For arbitrarias.
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));
  app.disable('x-powered-by');

  // Límite de tamaño de cuerpo JSON/urlencoded (los archivos van por multer con su propio límite).
  app.useBodyParser('json', { limit: '256kb' });
  app.useBodyParser('urlencoded', { limit: '256kb', extended: false });

  app.useGlobalFilters(new PrismaExceptionFilter());

  // Validación global: rechaza propiedades extra (whitelist) y transforma tipos
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: false, // no fallar si el cliente envía extras (ya los silenciamos)
      transform: true,           // convierte strings a number/boolean cuando el DTO lo indica
      transformOptions: { enableImplicitConversion: true },
      // En producción no se devuelve el objeto rechazado (evita reflejar datos de entrada).
      validationError: { target: false, value: false },
    }),
  );

  // CORS: solo los frontends configurados. Peticiones sin Origin (servidor a
  // servidor: Laravel, webhooks de PayPal) no pasan por CORS — se autentican
  // con su propia clave/firma.
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // false (no un Error): el navegador bloquea la respuesta, sin generar un 500.
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // x-admin-key / x-lms-m2m-key NO se exponen al navegador — solo servidor a servidor.
    allowedHeaders: ['Content-Type', 'Authorization'],
    // El token viaja en la cabecera Authorization, no en cookies.
    credentials: false,
    maxAge: 600,
  });

  // Cabeceras de seguridad. Esta API solo devuelve JSON: no necesita cargar
  // scripts, estilos ni ser embebida en iframes.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'no-referrer' },
      strictTransportSecurity: { maxAge: 63072000, includeSubDomains: true, preload: true },
    }),
  );

  // Nada de la API debe quedar en cachés intermedias (contiene datos personales).
  app.use((_req: unknown, res: { setHeader: (k: string, v: string) => void }, next: () => void) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  // Antes se servía /uploads como carpeta pública: cualquier comprobante de
  // pago (con datos personales) quedaba accesible por URL. Los comprobantes
  // ahora solo se guardan en Cloudinary, así que esa ruta se eliminó.

  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`API escuchando en el puerto ${port}`);
}
bootstrap();

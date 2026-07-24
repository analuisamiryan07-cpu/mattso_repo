import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validación global: rechaza propiedades extra (whitelist) y transforma tipos
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: false, // no fallar si el cliente envía extras (ya los silenciamos)
      transform: true,           // convierte strings a number/boolean cuando el DTO lo indica
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS: permite el frontend de Vercel + localhost en desarrollo
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS: Origen no permitido'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // x-admin-key NO se expone al navegador — solo Laravel → NestJS en servidor
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Cabeceras de seguridad HTTP con helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // Servir comprobantes locales como fallback si Supabase Storage no está configurado
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();

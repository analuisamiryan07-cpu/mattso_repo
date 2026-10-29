import { Logger } from '@nestjs/common';

/**
 * Revisa los secretos al arrancar.
 * - Fatal (no arranca): secreto obligatorio ausente, valor de ejemplo, o JWT_SECRET muy corto.
 * - Advertencia (arranca, pero queda en el log): secretos cortos o repetidos — hay que rotarlos.
 */
export function validateEnv(): void {
  const logger = new Logger('EnvValidation');
  const isProd = process.env.NODE_ENV === 'production';
  const errores: string[] = [];
  const avisos: string[] = [];

  const check = (name: string, opts: { obligatorio?: boolean; recomendado?: number; minimoFatal?: number } = {}) => {
    const value = process.env[name];
    if (!value) {
      if (opts.obligatorio) errores.push(`${name} no está configurado.`);
      return;
    }
    if (/CAMBIA_ESTO|changeme|TU_API/i.test(value)) errores.push(`${name} todavía tiene un valor de ejemplo.`);
    if (opts.minimoFatal && value.length < opts.minimoFatal) {
      errores.push(`${name} es demasiado corto (mínimo ${opts.minimoFatal} caracteres).`);
    } else if (opts.recomendado && value.length < opts.recomendado) {
      avisos.push(`${name} es corto (${value.length} caracteres); se recomiendan ${opts.recomendado}+. Rótalo con: openssl rand -hex 32`);
    }
  };

  check('JWT_SECRET', { obligatorio: true, minimoFatal: 16, recomendado: 32 });
  check('DATABASE_URL', { obligatorio: true });
  check('ADMIN_API_KEY', { obligatorio: isProd, recomendado: 32 });
  check('ID_HASH_SECRET', { obligatorio: isProd, recomendado: 32 });
  check('LMS_M2M_API_KEY', { recomendado: 32 });
  check('LMS_CLAVE_JWT_SECRET', { recomendado: 32 });
  check('LMS_ENROLLMENT_WEBHOOK_SECRET', { recomendado: 32 });

  if (isProd) {
    if (!process.env.FRONTEND_URL) errores.push('FRONTEND_URL no está configurado (CORS).');
    const inseguros = (process.env.FRONTEND_URL ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter((o) => o.startsWith('http://') && !o.includes('localhost'));
    if (inseguros.length) avisos.push(`FRONTEND_URL contiene orígenes sin https: ${inseguros.join(', ')}`);

    const valores = ['JWT_SECRET', 'ADMIN_API_KEY', 'LMS_M2M_API_KEY', 'LMS_CLAVE_JWT_SECRET', 'ID_HASH_SECRET']
      .map((k) => process.env[k])
      .filter(Boolean);
    if (new Set(valores).size !== valores.length) {
      avisos.push('Hay secretos repetidos entre JWT_SECRET / ADMIN_API_KEY / LMS_* / ID_HASH_SECRET — deben ser distintos.');
    }
  }

  avisos.forEach((a) => logger.warn(a));
  if (errores.length > 0) {
    errores.forEach((e) => logger.error(e));
    throw new Error('Configuración insegura o incompleta — el servidor no arrancará. Revisa las variables de entorno.');
  }
}

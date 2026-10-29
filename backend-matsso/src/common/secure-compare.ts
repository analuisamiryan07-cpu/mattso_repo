import { createHash, timingSafeEqual } from 'crypto';

/**
 * Compara dos secretos sin filtrar información por tiempo de respuesta.
 * Se comparan los SHA-256 de ambos valores para que la longitud tampoco
 * se pueda deducir midiendo cuánto tarda la comparación.
 */
export function safeEqual(received: unknown, expected: string | undefined): boolean {
  if (typeof received !== 'string' || !received || !expected) return false;
  const a = createHash('sha256').update(received).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Hash SHA-256 en hex — para guardar tokens de un solo uso sin dejarlos en texto plano en la BD. */
export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

//
// Firma y verificación HMAC-SHA256 para el webhook de inscripción
// (Moodles/arquitectura_lms_nube.md §5, §6). El mensaje firmado es
// `${timestamp}.${rawBody}` — nunca solo el body — para que una firma
// capturada no pueda reproducirse fuera de su ventana de tiempo.

import { createHmac, timingSafeEqual } from 'crypto';

const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 minutos hacia el pasado
const CLOCK_SKEW_MS = 60 * 1000; // 1 minuto hacia el futuro (relojes desincronizados)

export function signWebhookPayload(secret: string, timestamp: string, rawBody: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

export interface HmacVerificationResult {
  valid: boolean;
  reason?: 'missing_headers' | 'bad_timestamp' | 'expired' | 'future' | 'bad_signature';
}

/**
 * Verifica firma + ventana anti-repetición. `rawBody` debe ser el cuerpo
 * exacto recibido (string), no el objeto ya parseado — cualquier
 * reserialización (orden de llaves, espacios) invalida la firma.
 */
export function verifyWebhookSignature(
  secret: string,
  timestampHeader: string | undefined,
  signatureHeader: string | undefined,
  rawBody: string,
): HmacVerificationResult {
  if (!timestampHeader || !signatureHeader) {
    return { valid: false, reason: 'missing_headers' };
  }

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp)) {
    return { valid: false, reason: 'bad_timestamp' };
  }

  const now = Date.now();
  if (now - timestamp > REPLAY_WINDOW_MS) {
    return { valid: false, reason: 'expired' };
  }
  if (timestamp - now > CLOCK_SKEW_MS) {
    return { valid: false, reason: 'future' };
  }

  const expected = signWebhookPayload(secret, timestampHeader, rawBody);
  const expectedBuf = Buffer.from(expected, 'hex');
  const receivedBuf = Buffer.from(signatureHeader, 'hex');

  // Buffers de distinto tamaño: timingSafeEqual lanza en vez de devolver false.
  if (expectedBuf.length !== receivedBuf.length || !timingSafeEqual(expectedBuf, receivedBuf)) {
    return { valid: false, reason: 'bad_signature' };
  }

  return { valid: true };
}

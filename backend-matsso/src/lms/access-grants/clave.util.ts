// La "clave" que canjea el estudiante es un código numérico corto
// (AccessGrant.codigo, 10 dígitos) — fácil de escribir a mano o dictar por
// WhatsApp. Por dentro, cada clave también firma un JWT (jti = jwt_id) con un
// secreto PROPIO (LMS_CLAVE_JWT_SECRET), como identificador interno/de
// auditoría — pero ya NO es lo que el estudiante escribe ni lo que se
// compara al canjear (ver AccessGrantsService.canjear, que busca por
// `codigo` directo en la base, no verifica un JWT).

import * as jwt from 'jsonwebtoken';
import { randomInt } from 'crypto';

const CODIGO_LENGTH = 10;

/** Numérico de N dígitos, con ceros a la izquierda si hace falta — la unicidad se garantiza al insertar (columna @unique), con reintento si choca. */
export function generarCodigoCorto(): string {
  const max = 10 ** CODIGO_LENGTH;
  return String(randomInt(0, max)).padStart(CODIGO_LENGTH, '0');
}

export interface ClaveClaims {
  jti: string; // = AccessGrant.jwt_id
  sub: string; // usuario_id, como string (BigInt no es JSON-safe)
  course_id: string;
  curso_titulo: string;
  duracion_meses: number;
  modo_moodle: boolean;
  modo_coursera: boolean;
}

// Vencimiento del JWT en sí — no tiene nada que ver con la duración del
// acceso al curso (eso se cuenta aparte, desde que se canjea). Esto es solo
// para que una clave nunca canjeada no quede utilizable para siempre.
const CLAVE_EXPIRES_IN = '365d';

function secret(): string {
  const s = process.env.LMS_CLAVE_JWT_SECRET;
  if (!s) throw new Error('LMS_CLAVE_JWT_SECRET no configurado.');
  return s;
}

export function signClave(claims: ClaveClaims): string {
  return jwt.sign(claims, secret(), { expiresIn: CLAVE_EXPIRES_IN });
}

/** Lanza jwt.JsonWebTokenError / TokenExpiredError si la clave no es válida. */
export function verifyClave(token: string): ClaveClaims {
  return jwt.verify(token, secret()) as unknown as ClaveClaims;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

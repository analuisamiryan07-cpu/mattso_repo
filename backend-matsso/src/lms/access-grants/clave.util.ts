// La "clave" que el sistema interno genera y entrega a la persona (correo o
// WhatsApp) es un JWT firmado con un secreto PROPIO (LMS_CLAVE_JWT_SECRET),
// distinto del que firma el token de sesión (JWT_SECRET) — si uno se filtra,
// el otro sigue siendo seguro. Nunca se guarda completo en la base de datos:
// solo su `jti` (jwt_id), que es lo que permite invalidarla al canjearla sin
// tener que decodificarla primero.

import * as jwt from 'jsonwebtoken';

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

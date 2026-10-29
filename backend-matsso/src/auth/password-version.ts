import { createHmac } from 'crypto';

/**
 * Huella corta del hash de contraseña actual, incluida en el JWT como `pv`.
 * Cuando la contraseña cambia, la huella cambia y todos los tokens anteriores
 * dejan de ser válidos — sin necesidad de una tabla de revocación.
 * Se firma con JWT_SECRET para que no se pueda calcular desde fuera.
 */
export function passwordVersion(passwordHash: string): string {
  return createHmac('sha256', process.env.JWT_SECRET as string)
    .update(passwordHash)
    .digest('base64url')
    .slice(0, 16);
}

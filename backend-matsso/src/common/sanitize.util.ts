/** Elimina cualquier etiqueta HTML de un texto libre antes de guardarlo o de interpolarlo en un correo. */
export function sanitizePlainText<T extends string | null | undefined>(input: T): T {
  if (input == null) return input;
  return input.replace(/<[^>]*>/g, '').trim() as T;
}

/** Elimina cualquier etiqueta HTML de un texto libre antes de guardarlo o de interpolarlo en un correo. */
export function sanitizePlainText<T extends string | null | undefined>(input: T): T {
  if (input == null) return input;
  return input.replace(/<[^>]*>/g, '').trim() as T;
}

/**
 * Escapa entidades HTML (&, <, >, ", ') para interpolar texto de forma segura dentro de un
 * documento HTML (por ejemplo, el cuerpo de un correo). `sanitizePlainText` quita etiquetas
 * completas, pero una expresión regular de etiquetas no es una garantía completa contra XSS
 * (fragmentos malformados, saltos de contexto de atributo, etc.) — el escape por contexto es
 * la defensa real al construir HTML con datos no confiables. Usar junto a `sanitizePlainText`,
 * no en su lugar.
 */
export function escapeHtml<T extends string | null | undefined>(input: T): T {
  if (input == null) return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;') as T;
}

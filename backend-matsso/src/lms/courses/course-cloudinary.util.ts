// Convención de carpetas de Cloudinary para cursos (acordada con el negocio):
//
//   Cursos/{cloudinary_folder}/hero
//   Cursos/{cloudinary_folder}/izquierda
//   Cursos/{cloudinary_folder}/derecha        <- para la página pública,
//                                                 igual que capacitaciones/certificaciones
//   Cursos/{cloudinary_folder}/moodle/...     <- imágenes propias del Aula Virtual (Moodle)
//   Cursos/{cloudinary_folder}/coursera/...   <- imágenes propias del Aula Virtual (Coursera)
//
// A diferencia de capacitaciones/certificaciones (donde alguien sube la
// imagen a mano a Cloudinary y escribe un número de memoria — con riesgo real
// de pisar la de otro producto), aquí la carpeta se genera sola a partir del
// título y se garantiza única en la base de datos. No se recalcula si el
// título del curso cambia después: las imágenes ya subidas se quedan donde
// están, apuntando a la carpeta original.

import { PrismaService } from '../../prisma/prisma.service';

const CLOUDINARY_ROOT = 'Cursos';

export function cloudinaryCourseFolderPath(folder: string): string {
  return `${CLOUDINARY_ROOT}/${folder}`;
}

/**
 * Limpia el título para usarlo como nombre de carpeta y evita choques: si
 * "Riesgos Laborales" ya existe, la siguiente es "Riesgos Laborales (2)".
 * Cloudinary acepta espacios y mayúsculas en un nombre de carpeta — se deja
 * legible, no se fuerza un slug con guiones.
 */
export async function buildCloudinaryFolder(prisma: PrismaService, titulo: string): Promise<string> {
  const base =
    titulo
      .replace(/[/\\?#%]/g, '') // caracteres que Cloudinary no acepta en una ruta
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 200) || 'Curso';

  let candidate = base;
  let n = 2;
  // n. de cursos es pequeño (catálogo real, no miles de filas) — un loop
  // secuencial es suficiente y más simple que una consulta con LIKE.
  while (
    await prisma.course.findUnique({ where: { cloudinary_folder: candidate }, select: { id: true } })
  ) {
    candidate = `${base} (${n})`;
    n++;
  }
  return candidate;
}

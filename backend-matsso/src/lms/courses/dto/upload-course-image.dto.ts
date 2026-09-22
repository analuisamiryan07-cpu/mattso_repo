import { IsIn } from 'class-validator';

// hero/izquierda/derecha: página pública (se pisan al volver a subir).
// moodle/coursera: portada del curso dentro del Aula Virtual — se puede
// subir más de una con el tiempo, cada una queda como archivo nuevo.
export const COURSE_IMAGE_SLOTS = ['hero', 'izquierda', 'derecha', 'moodle', 'coursera'] as const;
export type CourseImageSlot = (typeof COURSE_IMAGE_SLOTS)[number];

export class UploadCourseImageDto {
  @IsIn(COURSE_IMAGE_SLOTS)
  slot: CourseImageSlot;
}

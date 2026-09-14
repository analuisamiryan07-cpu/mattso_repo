// Destino final: backend-matsso/src/lms/lms.module.ts
//
// Un único módulo plano para todo el LMS, igual que catalog/orders/contact
// en el resto del backend (no se crean submódulos por carpeta — es código
// nuevo, no hay razón para una jerarquía que el resto del proyecto no usa).
// Se registra importándolo en app.module.ts — ver Moodles/lms/docs/INTEGRACION.md.

import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';

import { EnrollmentService } from './enrollment/enrollment.service';
import { EnrollmentWebhookController } from './enrollment/enrollment-webhook.controller';

import { CoursesService } from './courses/courses.service';
import { CoursesController } from './courses/courses.controller';
import { AdminCoursesService } from './courses/admin-courses.service';
import { AdminCoursesController } from './courses/admin-courses.controller';

import { ProgressService } from './progress/progress.service';
import { ProgressController } from './progress/progress.controller';

import { SubmissionsService } from './submissions/submissions.service';
import { SubmissionsController } from './submissions/submissions.controller';

import { QuizzesService } from './quizzes/quizzes.service';
import { QuizzesController } from './quizzes/quizzes.controller';

// PrismaModule es @Global() — no requiere import. StorageModule NO es global
// (se importa explícitamente donde se usa, igual que en OrdersModule), por
// eso se importa aquí para que SubmissionsService pueda inyectar StorageService.

@Module({
  imports: [StorageModule],
  controllers: [
    EnrollmentWebhookController,
    CoursesController,
    AdminCoursesController,
    ProgressController,
    SubmissionsController,
    QuizzesController,
  ],
  providers: [
    EnrollmentService,
    CoursesService,
    AdminCoursesService,
    ProgressService,
    SubmissionsService,
    QuizzesService,
  ],
})
export class LmsModule {}

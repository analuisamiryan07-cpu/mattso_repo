// Un único módulo plano para todo el LMS, igual que catalog/orders/contact
// en el resto del backend (no se crean submódulos por carpeta — es código
// nuevo, no hay razón para una jerarquía que el resto del proyecto no usa).
// Se registra importándolo en app.module.ts.

import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';

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

import { AccessGrantsService } from './access-grants/access-grants.service';
import { AccessGrantsController } from './access-grants/access-grants.controller';

import { ProfessorCoursesService } from './professor/professor-courses.service';
import { ProfessorCoursesController } from './professor/professor-courses.controller';

import { AdminProfessorsService } from './professor/admin-professors.service';
import { AdminProfessorsController } from './professor/admin-professors.controller';

import { LmsGateService } from './gate/lms-gate.service';
import { LmsGateController } from './gate/lms-gate.controller';

// PrismaModule es @Global() — no requiere import. StorageModule, EmailModule
// y AuthModule NO son globales (se importan explícitamente donde se usan,
// igual que en OrdersModule), por eso se importan aquí.

@Module({
  imports: [StorageModule, EmailModule, AuthModule],
  controllers: [
    EnrollmentWebhookController,
    CoursesController,
    AdminCoursesController,
    ProgressController,
    SubmissionsController,
    QuizzesController,
    AccessGrantsController,
    ProfessorCoursesController,
    AdminProfessorsController,
    LmsGateController,
  ],
  providers: [
    EnrollmentService,
    CoursesService,
    AdminCoursesService,
    ProgressService,
    SubmissionsService,
    QuizzesService,
    AccessGrantsService,
    ProfessorCoursesService,
    AdminProfessorsService,
    LmsGateService,
  ],
  // EnrollmentService se exporta a propósito — OrdersModule y PaymentsModule
  // lo necesitan para inscribir al comprador en cuanto una orden se marca
  // PAGADA (ver enrollAllItemsFromOrder en enrollment.service.ts).
  exports: [EnrollmentService],
})
export class LmsModule {}

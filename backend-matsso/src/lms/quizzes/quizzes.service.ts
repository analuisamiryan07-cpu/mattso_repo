// Regla de seguridad clave: `is_correct` de QuizOption NUNCA se envía al
// cliente antes de calificar (getQuizForStudent lo omite explícitamente). La
// corrección se calcula siempre en el servidor a partir de lo guardado en BD,
// nunca confiando en lo que el cliente dice que es correcto.

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CoursesService } from '../courses/courses.service';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';

@Injectable()
export class QuizzesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coursesService: CoursesService,
  ) {}

  async getQuizForStudent(contentItemId: string, usuarioId: number) {
    const { contentItem, enrollmentId } = await this.coursesService.assertContentItemUnlockedForStudent(
      contentItemId,
      usuarioId,
    );
    if (contentItem.item_type !== 'QUIZ') {
      throw new BadRequestException('Este contenido no es un cuestionario.');
    }

    const quiz = await this.prisma.quiz.findUnique({
      where: { content_item_id: contentItemId },
      include: {
        questions: {
          orderBy: { sequence_order: 'asc' },
          include: { options: { orderBy: { sequence_order: 'asc' }, select: { id: true, texto: true, sequence_order: true } } },
        },
      },
    });
    if (!quiz) throw new NotFoundException('Cuestionario no encontrado.');

    const attemptsUsed = await this.prisma.quizAttempt.count({
      where: { enrollment_id: enrollmentId, quiz_id: quiz.id },
    });

    return {
      id: quiz.id,
      titulo: quiz.titulo,
      passing_score: Number(quiz.passing_score),
      max_attempts: quiz.max_attempts,
      time_limit_seconds: quiz.time_limit_seconds,
      attempts_used: attemptsUsed,
      can_attempt: quiz.max_attempts == null || attemptsUsed < quiz.max_attempts,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        enunciado: q.enunciado,
        question_type: q.question_type,
        options: q.options, // sin is_correct
      })),
    };
  }

  async startAttempt(quizId: string, usuarioId: number) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId }, include: { content_item: true } });
    if (!quiz) throw new NotFoundException('Cuestionario no encontrado.');

    const { enrollmentId } = await this.coursesService.assertContentItemUnlockedForStudent(
      quiz.content_item_id,
      usuarioId,
    );

    const attemptsUsed = await this.prisma.quizAttempt.count({ where: { enrollment_id: enrollmentId, quiz_id: quizId } });
    if (quiz.max_attempts != null && attemptsUsed >= quiz.max_attempts) {
      throw new ForbiddenException('Ya alcanzaste el número máximo de intentos para este cuestionario.');
    }

    const inProgress = await this.prisma.quizAttempt.findFirst({
      where: { enrollment_id: enrollmentId, quiz_id: quizId, status: 'IN_PROGRESS' },
    });
    if (inProgress) return inProgress; // reanuda el intento abierto en vez de crear uno nuevo

    return this.prisma.quizAttempt.create({
      data: {
        enrollment_id: enrollmentId,
        quiz_id: quizId,
        attempt_number: attemptsUsed + 1,
        status: 'IN_PROGRESS',
      },
    });
  }

  async submitAttempt(attemptId: string, dto: SubmitQuizAttemptDto, usuarioId: number) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        enrollment: { select: { usuario_id: true, id: true } },
        quiz: { include: { questions: { include: { options: true } } } },
      },
    });
    if (!attempt) throw new NotFoundException('Intento no encontrado.');
    if (Number(attempt.enrollment.usuario_id) !== usuarioId) {
      throw new ForbiddenException('Este intento no te pertenece.');
    }
    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Este intento ya fue calificado.');
    }

    const questionsById = new Map(attempt.quiz.questions.map((q) => [q.id, q]));
    let earnedPoints = 0;
    let totalPoints = 0;
    const perQuestionResult: { question_id: string; correct: boolean }[] = [];

    const answerWrites: any[] = [];

    for (const question of attempt.quiz.questions) {
      totalPoints += Number(question.points);
      const answer = dto.answers.find((a) => a.question_id === question.id);
      const correctOptionIds = new Set(question.options.filter((o) => o.is_correct).map((o) => o.id));
      const selectedIds = new Set(answer?.selected_option_ids ?? []);

      const isCorrect =
        selectedIds.size === correctOptionIds.size &&
        [...selectedIds].every((id) => correctOptionIds.has(id));

      if (isCorrect) earnedPoints += Number(question.points);
      perQuestionResult.push({ question_id: question.id, correct: isCorrect });

      if (answer) {
        // Valida que las opciones seleccionadas pertenezcan realmente a esta pregunta
        const validOptionIds = new Set(question.options.map((o) => o.id));
        for (const optId of answer.selected_option_ids) {
          if (!validOptionIds.has(optId)) {
            throw new BadRequestException(`La opción ${optId} no pertenece a la pregunta ${question.id}.`);
          }
        }
        answerWrites.push(
          this.prisma.quizAttemptAnswer.create({
            data: {
              attempt_id: attemptId,
              question_id: question.id,
              selected_options: {
                create: answer.selected_option_ids.map((optionId) => ({ option_id: optionId })),
              },
            },
          }),
        );
      }
    }

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = score >= Number(attempt.quiz.passing_score);

    await this.prisma.$transaction([
      ...answerWrites,
      this.prisma.quizAttempt.update({
        where: { id: attemptId },
        data: { status: 'GRADED', score, passed, submitted_at: new Date() },
      }),
      ...(passed
        ? [
            this.prisma.studentProgress.upsert({
              where: {
                enrollment_id_content_item_id: {
                  enrollment_id: attempt.enrollment.id,
                  content_item_id: attempt.quiz.content_item_id,
                },
              },
              update: { status: 'COMPLETED', completed_at: new Date() },
              create: {
                enrollment_id: attempt.enrollment.id,
                content_item_id: attempt.quiz.content_item_id,
                status: 'COMPLETED',
                completed_at: new Date(),
              },
            }),
          ]
        : []),
    ]);

    return { score: Math.round(score * 100) / 100, passed, details: perQuestionResult };
  }
}

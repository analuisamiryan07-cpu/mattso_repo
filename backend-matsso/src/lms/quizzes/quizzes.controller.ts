
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { QuizzesService } from './quizzes.service';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/lms')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get('content/:contentItemId/quiz')
  getQuiz(@Param('contentItemId') contentItemId: string, @Req() req: any) {
    return this.quizzesService.getQuizForStudent(contentItemId, req.user.id);
  }

  @Post('quizzes/:quizId/attempts')
  startAttempt(@Param('quizId') quizId: string, @Req() req: any) {
    return this.quizzesService.startAttempt(quizId, req.user.id);
  }

  @Post('quizzes/attempts/:attemptId/submit')
  submitAttempt(@Param('attemptId') attemptId: string, @Body() dto: SubmitQuizAttemptDto, @Req() req: any) {
    return this.quizzesService.submitAttempt(attemptId, dto, req.user.id);
  }
}

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from '../email/email.service';
import { EMAIL_QUEUE, EMAIL_JOBS } from './queue.constants';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Procesando job "${job.name}" id=${job.id}`);

    switch (job.name) {
      case EMAIL_JOBS.ORDER_CREATED:
        await this.emailService.sendOrderConfirmation(job.data);
        break;

      case EMAIL_JOBS.PAYMENT_APPROVED:
        await this.emailService.sendPaymentApproved(job.data);
        break;

      case EMAIL_JOBS.PAYMENT_REJECTED:
        await this.emailService.sendPaymentRejected(job.data);
        break;

      default:
        this.logger.warn(`Job desconocido recibido: ${job.name}`);
    }
  }
}

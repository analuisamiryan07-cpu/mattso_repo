import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailModule } from '../email/email.module';
import { EmailProcessor } from './email.processor';
import { EMAIL_QUEUE } from './queue.constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    EmailModule,
  ],
  providers: [EmailProcessor],
  exports: [BullModule],
})
export class QueueModule {}

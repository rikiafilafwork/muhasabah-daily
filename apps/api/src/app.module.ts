import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AppConfig } from './config/app-config.service';
import { AppConfigModule } from './config/config.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { MemorizationModule } from './modules/memorization/memorization.module';
import { AiModule } from './modules/ai/ai.module';
import { JournalModule } from './modules/journal/journal.module';
import { LectureNotesModule } from './modules/lecture-notes/lecture-notes.module';
import { PrayerTimesModule } from './modules/prayer-times/prayer-times.module';
import { QuranModule } from './modules/quran/quran.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { DhikrModule } from './modules/dhikr/dhikr.module';
import { EventsModule } from './modules/events/events.module';
import { FinanceModule } from './modules/finance/finance.module';
import { FocusModule } from './modules/focus/focus.module';
import { GoalsModule } from './modules/goals/goals.module';
import { HabitsModule } from './modules/habits/habits.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { RedisModule } from './redis/redis.module';

const REQUEST_ID_PATTERN = /^[\w-]{1,64}$/;

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        pinoHttp: {
          level: config.get('NODE_ENV') === 'test' ? 'silent' : config.get('LOG_LEVEL'),
          genReqId: (req: IncomingMessage, res) => {
            const incoming = req.headers['x-request-id'];
            const id =
              typeof incoming === 'string' && REQUEST_ID_PATTERN.test(incoming)
                ? incoming
                : randomUUID();
            res.setHeader('x-request-id', id);
            return id;
          },
          customAttributeKeys: { reqId: 'requestId' },
          // Jangan pernah mencatat kredensial atau isi body (jurnal bersifat pribadi).
          redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
          serializers: {
            req: (req: { id: string; method: string; url: string }) => ({
              id: req.id,
              method: req.method,
              url: req.url,
            }),
            res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
          },
          transport: config.isProduction
            ? undefined
            : {
                target: 'pino-pretty',
                options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' },
              },
        },
      }),
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    PrismaModule,
    RedisModule,
    QueueModule,
    AuthModule,
    UsersModule,
    PrayerTimesModule,
    HealthModule,
    EventsModule,
    TasksModule,
    HabitsModule,
    GoalsModule,
    FocusModule,
    DhikrModule,
    QuranModule,
    MemorizationModule,
    AiModule,
    JournalModule,
    LectureNotesModule,
    RemindersModule,
    FinanceModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}

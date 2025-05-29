
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { OpenAIService } from './openai.service';
import { OpenAIController } from './openai.controller';
import { AuthModule } from '../auth/auth.module';
import { FiguraModule } from 'src/figura/figura.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    FiguraModule,
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [OpenAIController],
  providers: [OpenAIService],
  exports: [OpenAIService]
})
export class OpenAIModule {}

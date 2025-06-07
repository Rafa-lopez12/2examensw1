
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { OpenAIService } from './openai.service';
import { OpenAIController } from './openai.controller';
import { AuthModule } from '../auth/auth.module';
import { FiguraModule } from '../figura/figura.module';
import { VistaModule } from '../vista/vista.module';
import { AutoNavigationService } from './auto-navigation.service';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    FiguraModule,
    VistaModule,
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [OpenAIController],
  providers: [OpenAIService, AutoNavigationService],
  exports: [OpenAIService,AutoNavigationService]
})
export class OpenAIModule {}

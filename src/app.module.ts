import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DiagramWsModule } from './diagram-ws/diagram-ws.module';

import { ProyectoModule } from './proyecto/proyecto.module';
import { VistaModule } from './vista/vista.module';
import { FiguraModule } from './figura/figura.module';
import { OpenAIModule } from './openai/openai.module';




@Module({
  imports: [
    DiagramWsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5433,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,      
      autoLoadEntities: true,
      synchronize: true,
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname,'..','public'), 
    }),
    AuthModule,

    ProyectoModule,
    VistaModule,
    FiguraModule,
    OpenAIModule
    
  ],
  providers: [],

})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ProyectoService } from './proyecto.service';
import { ProyectoController } from './proyecto.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from './entities/proyecto.entity';
import { User } from '../auth/entities/auth.entity';

@Module({
  controllers: [ProyectoController],
  providers: [ProyectoService],
  imports: [TypeOrmModule.forFeature([Proyecto, User])]
})
export class ProyectoModule {}

import { Module } from '@nestjs/common';
import { VistaService } from './vista.service';
import { VistaController } from './vista.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vista } from './entities/vista.entity';
import { Proyecto } from '../proyecto/entities/proyecto.entity';

@Module({
  controllers: [VistaController],
  providers: [VistaService],
  imports: [TypeOrmModule.forFeature([Vista, Proyecto])],
  exports: [VistaService]
})
export class VistaModule {}

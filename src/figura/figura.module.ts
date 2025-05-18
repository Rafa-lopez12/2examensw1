import { Module } from '@nestjs/common';
import { FiguraService } from './figura.service';
import { FiguraController } from './figura.controller';
import { Figura } from './entities/figura.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vista } from '../vista/entities/vista.entity';

@Module({
  controllers: [FiguraController],
  providers: [FiguraService],
  imports: [TypeOrmModule.forFeature([Figura, Vista])],
  exports:[FiguraService]
})
export class FiguraModule {}

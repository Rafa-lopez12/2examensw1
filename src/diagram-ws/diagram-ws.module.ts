import { Module } from '@nestjs/common';
import { DiagramWsService } from './diagram-ws.service';
import { DiagramWsGateway } from './diagram-ws.gateway';
import { FiguraModule } from '../figura/figura.module';
import { VistaModule } from '../vista/vista.module';

@Module({
  imports: [FiguraModule, VistaModule],
  providers: [DiagramWsGateway, DiagramWsService],

  
  
})
export class DiagramWsModule {}

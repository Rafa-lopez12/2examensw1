import { PartialType } from '@nestjs/mapped-types';
import { CreateFiguraDto } from './create-figura.dto';
import { IsNumber, IsString } from 'class-validator';

export class UpdateFiguraDto extends PartialType(CreateFiguraDto) {

        tipo?: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        radius?: number;
        points?: number[];
        text?: string;
        fontSize?: number;
        fontFamily?: string;
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        rotation?: number;
        opacity?: number;
        vistaId?: string;
        //paginaId?: string;
        zIndex?: number;
        additionalProps?: Record<string, any>;
}

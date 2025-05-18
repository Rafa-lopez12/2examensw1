import { PartialType } from '@nestjs/mapped-types';
import { CreateVistaDto } from './create-vista.dto';

export class UpdateVistaDto extends PartialType(CreateVistaDto) {}

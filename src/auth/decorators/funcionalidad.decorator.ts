// auth/decorators/funcionalidad.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Funcionalidad = (nombre: string) => SetMetadata('funcionalidad', nombre);

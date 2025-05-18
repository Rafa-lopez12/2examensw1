import { IsString, IsUUID } from "class-validator";

export class CreateVistaDto {
    @IsString()
    nombre:string

    @IsUUID()
    proyectoId: string
}

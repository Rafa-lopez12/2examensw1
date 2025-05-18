import { IsString, IsUUID } from "class-validator";

export class CreateProyectoDto {
    @IsString()
    nombre:string

    @IsUUID()
    usuarioId:string
}

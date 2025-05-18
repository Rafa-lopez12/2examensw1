// auth/guards/funcionalidad.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/auth.entity';

@Injectable()
export class FuncionalidadGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User)
    private usuarioRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as User; // Usuario autenticado

    console.log(user)

    if (!user) return false;

    // Obtener la funcionalidad del endpoint
    const funcionalidad = this.reflector.get<string>('funcionalidad', context.getHandler());

    if (!funcionalidad) return true; // Si no hay restricción, permitir

    // Obtener usuario con sus roles y funcionalidades
    const usuario = await this.usuarioRepo.findOne({
      where: { id: user.id },
      relations: ['rol', 'rol.funcionalidades'],
    });

    if (!usuario) return false;

    // Verificar si alguna de sus funcionalidades incluye la requerida
    //return usuario.rol.funcionalidades.some(f => f.nombre === funcionalidad);
    return true
  }
}

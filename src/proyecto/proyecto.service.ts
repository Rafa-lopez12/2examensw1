import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Proyecto } from './entities/proyecto.entity';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/auth.entity';

@Injectable()
export class ProyectoService {

  @InjectRepository(Proyecto)
  private readonly proyectoRepository: Repository<Proyecto>

  @InjectRepository(User)
  private readonly userRepository: Repository<User>



  async create(createProyectoDto: CreateProyectoDto) {
    
    const {usuarioId, ...proyectoData}=createProyectoDto

    const usuario = await this.userRepository.findOne({ where: { id: usuarioId } });
    if (!usuario) {
      throw new Error('El usuario especificado no existe');
    }

    const proyecto= this.proyectoRepository.create({
      ...proyectoData,
      usuario
    })

    const proyec=this.proyectoRepository.save(proyecto)
    return proyec;
  }

  async findAll(id:string) {
    
    const usuario= await this.userRepository.findOne({where: {id:id}, relations: ['proyec']});
    if (!usuario) {
      throw new Error('El usuario especificado no existe');
    }

    const proyectos= await this.proyectoRepository.find({ where:{ usuario: {id}}})
    const proyectosInvitado = usuario.proyec || [];
    
  
    // Combinar ambos arrays y eliminar duplicados (si los hubiera)
    const todosProyectos = [
      ...proyectos,
      ...proyectosInvitado
    ];
    
    // Eliminar duplicados por ID de proyecto
    const proyectosUnicos = Array.from(
      new Map(todosProyectos.map(proyecto => [proyecto.id, proyecto])).values()
    );
    
    return proyectosUnicos;
  }

  findOne(id: number) {
    return `This action returns a #${id} proyecto`;
  }

  async update(id: string, updateProyectoDto: UpdateProyectoDto) {
    const proyecto = await this.proyectoRepository.findOne({ where: { id } });
    
    if (!proyecto) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    }
    
    // Actualizar solo el nombre del proyecto
    if (updateProyectoDto.nombre) {
      proyecto.nombre = updateProyectoDto.nombre;
    }
    
    // Si se proporciona un nuevo usuario, actualizar la relación
    if (updateProyectoDto.usuarioId) {
      const usuario = await this.userRepository.findOne({ 
        where: { id: updateProyectoDto.usuarioId } 
      });
      
      if (!usuario) {
        throw new Error('El usuario especificado no existe');
      }
      
      proyecto.usuario = usuario;
    }
    
    await this.proyectoRepository.save(proyecto);
    return proyecto;
  }

  

  remove(id: number) {
    return `This action removes a #${id} proyecto`;
  }
}

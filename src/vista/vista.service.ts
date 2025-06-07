import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVistaDto } from './dto/create-vista.dto';
import { UpdateVistaDto } from './dto/update-vista.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vista } from './entities/vista.entity';
import { Figura } from '../figura/entities/figura.entity';
import { Proyecto } from '../proyecto/entities/proyecto.entity';

@Injectable()
export class VistaService {

  @InjectRepository(Vista)
  private readonly vistaRepository: Repository<Vista>

  @InjectRepository(Proyecto)
  private readonly proyectoRepository: Repository<Proyecto>

  async create(createVistaDto: CreateVistaDto) {
    
    const {proyectoId, ...vistaData}= createVistaDto

    const proyecto = await this.proyectoRepository.findOne({ where: { id: proyectoId } });
      if (!proyecto) {
        throw new Error('El proyecto especificado no existe');
      }
  
    const vista=this.vistaRepository.create({
      ...vistaData,
      proyecto
    })
    
    const vist=await this.vistaRepository.save(vista)
    return vist;
  }

  async findAll(id: string) {
    
    const proyecto = await this.proyectoRepository.findOne({ where: { id: id } });
    if (!proyecto) {
      throw new Error('El proyecto especificado no existe');
    }

    const vistas = await this.vistaRepository.find({ 
      where: { proyecto: { id } },
      relations: ['proyecto']
    });
  
    return vistas;
  }

  findOne(id: number) {
    return `This action returns a #${id} vista`;
  }

  async update(id: string, updateVistaDto: UpdateVistaDto) {
    const vista = await this.vistaRepository.findOne({ where: { id } });
    
    if (!vista) {
      throw new NotFoundException(`Vista con ID ${id} no encontrada`);
    }
    
    // Actualizar el nombre de la vista
    if (updateVistaDto.nombre) {
      vista.nombre = updateVistaDto.nombre;
    }
    
    // Si se proporciona un nuevo proyecto, actualizar la relación
    if (updateVistaDto.proyectoId) {
      const proyecto = await this.proyectoRepository.findOne({ 
        where: { id: updateVistaDto.proyectoId } 
      });
      
      if (!proyecto) {
        throw new Error('El proyecto especificado no existe');
      }
      
      vista.proyecto = proyecto;
    }
    
    await this.vistaRepository.save(vista);
    return vista;
  }

  remove(id: number) {
    return `This action removes a #${id} vista`;
  }
}

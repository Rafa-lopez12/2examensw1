import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFiguraDto } from './dto/create-figura.dto';
import { UpdateFiguraDto } from './dto/update-figura.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Figura } from './entities/figura.entity';
import { DataSource, Repository } from 'typeorm';
import { Vista } from '../vista/entities/vista.entity';

@Injectable()
export class FiguraService {

  constructor(
    @InjectRepository(Figura)
    private readonly figuraRepository: Repository<Figura>,
  
    @InjectRepository(Vista)
    private readonly vistaRepository: Repository<Vista>,
  ){}
 


  async create(createFiguraDto: CreateFiguraDto) {
    const {vistaId, ...figuraData}=createFiguraDto
    console.log('la vista:' , vistaId)
    console.log('la figura:', {...figuraData})
    const vista = await this.vistaRepository.findOne({ where: { id: vistaId } });
    if (!vista) {
      throw new Error('la vista especificado no existe');
    }

    const figura= this.figuraRepository.create({
      ...figuraData,
      vista
    })

    const figu=this.figuraRepository.save(figura)
    return figu;
  }

  async findAll(id:string) {
    
    
    const vista= await this.vistaRepository.findOne({where: {id:id}});
    if (!vista) {
      throw new Error('la vista especificado no existe');
    }

    const figuras= this.figuraRepository.find({ where:{ vista: {id}}})

    return figuras;
  }

  async findOne(id: string) {
    const figura = await this.figuraRepository.findOne({ where: { id: id } });
    
    if (!figura) {
      throw new NotFoundException(`Figura con ID ${id} no encontrada`);
    }
    
    return figura;
  }

  async update(id: string, updateFiguraDto: UpdateFiguraDto) {
    const figura = await this.figuraRepository.findOne({where: {id:id}});
    if (!figura) {
      throw new NotFoundException(`Figura con ID ${id} no encontrada`);
    }
    // Actualizar solo los campos proporcionados
    Object.assign(figura, updateFiguraDto);
    
    return this.figuraRepository.save(figura);
  }

  async remove(id: string) {
    // Verificar si la figura existe
    const figura = await this.figuraRepository.findOne({where: {id}});
    if (!figura) {
      throw new NotFoundException(`Figura con ID ${id} no encontrada`);
    }
    
    // Eliminar la figura
    await this.figuraRepository.remove(figura);
    
    // Devolver el ID de la figura eliminada para confirmar
    return { 
      success: true,
      id,
      message: `La figura ${id} ha sido eliminada con éxito`
    };
  }

  
}

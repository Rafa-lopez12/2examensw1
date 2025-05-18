import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VistaService } from './vista.service';
import { CreateVistaDto } from './dto/create-vista.dto';
import { UpdateVistaDto } from './dto/update-vista.dto';

@Controller('vista')
export class VistaController {
  constructor(private readonly vistaService: VistaService) {}

  @Post()
  create(@Body() createVistaDto: CreateVistaDto) {
    return this.vistaService.create(createVistaDto);
  }

  @Get('findall/:id')
  findAll(@Param('id') id:string) {
    return this.vistaService.findAll(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vistaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVistaDto: UpdateVistaDto) {
    return this.vistaService.update(id, updateVistaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vistaService.remove(+id);
  }
}

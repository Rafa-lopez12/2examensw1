import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FiguraService } from './figura.service';
import { CreateFiguraDto } from './dto/create-figura.dto';
import { UpdateFiguraDto } from './dto/update-figura.dto';

@Controller('figura')
export class FiguraController {
  constructor(private readonly figuraService: FiguraService) {}

  @Post()
  create(@Body() createFiguraDto: CreateFiguraDto) {
    return this.figuraService.create(createFiguraDto);
  }

  @Get('findall/:id')
  findAll(@Param('id') id:string) {
    return this.figuraService.findAll(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.figuraService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFiguraDto: UpdateFiguraDto) {
    return this.figuraService.update(id, updateFiguraDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.figuraService.remove(id);
  }
}

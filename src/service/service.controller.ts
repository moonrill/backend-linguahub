import { PaginationDto } from '#/utils/pagination.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceService } from './service.service';

@ApiTags('Services')
@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  async create(@Body() createServiceDto: CreateServiceDto, @Request() req) {
    return {
      data: await this.serviceService.create(createServiceDto, req.user.id),
      statusCode: HttpStatus.CREATED,
      message: 'Success create service',
    };
  }

  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('price') price: string,
  ) {
    const result = await this.serviceService.findAll(paginationDto, price);

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get all services',
    };
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return {
      data: await this.serviceService.findById(id),
      statusCode: HttpStatus.OK,
      message: 'Success get service by id',
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return {
      data: await this.serviceService.update(id, updateServiceDto),
      statusCode: HttpStatus.OK,
      message: 'Success update service',
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.serviceService.remove(id);
  }
}

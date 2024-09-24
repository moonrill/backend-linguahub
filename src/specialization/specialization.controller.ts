import { Role } from '#/auth/role.enum';
import { Roles } from '#/auth/roles.decorator';
import { Public } from '#/auth/strategies/public.strategy';
import { PaginationDto } from '#/utils/pagination.dto';
import { uploadImage } from '#/utils/upload-image';
import {
  BadRequestException,
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateSpecializationDto } from './dto/create-specialization.dto';
import { UpdateSpecializationDto } from './dto/update-specialization.dto';
import { SpecializationService } from './specialization.service';

@Controller('specializations')
export class SpecializationController {
  constructor(private readonly specializationService: SpecializationService) {}

  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('logo', uploadImage('specialization')))
  async create(
    @Body() createSpecializationDto: CreateSpecializationDto,
    @UploadedFile()
    logo: Express.Multer.File,
  ) {
    if (!logo) {
      throw new BadRequestException('Logo is required');
    }

    return {
      data: await this.specializationService.create(
        createSpecializationDto,
        logo,
      ),
      statusCode: HttpStatus.CREATED,
      message: 'Success create specialization',
    };
  }

  @Public()
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.specializationService.findAll(paginationDto);

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get all specializations',
    };
  }

  @Public()
  @Get(':name')
  async findOne(@Param('name') name: string) {
    return {
      data: await this.specializationService.findByName(name),
      statusCode: HttpStatus.OK,
      message: 'Success get specialization by name',
    };
  }

  @Roles(Role.ADMIN)
  @Put(':id')
  @UseInterceptors(FileInterceptor('logo', uploadImage('specialization')))
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateSpecializationDto: UpdateSpecializationDto,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    return {
      data: await this.specializationService.update(
        id,
        updateSpecializationDto,
        logo,
      ),
      statusCode: HttpStatus.OK,
      message: 'Success update specialization',
    };
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.specializationService.remove(id);
  }
}

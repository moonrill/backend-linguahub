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
import { ApiTags } from '@nestjs/swagger';
import { CreateSpecializationDto } from './dto/create-specialization.dto';
import { UpdateSpecializationDto } from './dto/update-specialization.dto';
import { SpecializationService } from './specialization.service';

@ApiTags('Specialization')
@Controller('specializations')
export class SpecializationController {
  constructor(private readonly specializationService: SpecializationService) {}

  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createSpecializationDto: CreateSpecializationDto) {
    return {
      data: await this.specializationService.create(createSpecializationDto),
      statusCode: HttpStatus.CREATED,
      message: 'Success create specialization',
    };
  }

  @Post('/upload/logo')
  @UseInterceptors(FileInterceptor('logo', uploadImage('specialization')))
  async uploadLogo(@UploadedFile() logo: Express.Multer.File) {
    if (typeof logo === 'undefined') {
      throw new BadRequestException('Flag image is not uploaded');
    }

    return {
      logo: logo?.filename,
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
  async findOne(
    @Param('name') name: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.specializationService.findByName(
      name,
      paginationDto,
    );

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get specialization by name',
    };
  }

  @Roles(Role.ADMIN)
  @Put(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateSpecializationDto: UpdateSpecializationDto,
  ) {
    return {
      data: await this.specializationService.update(
        id,
        updateSpecializationDto,
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

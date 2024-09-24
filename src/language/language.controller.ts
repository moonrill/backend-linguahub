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
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { LanguageService } from './language.service';

@Controller('languages')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('flag_image', uploadImage('flag')))
  async create(
    @Body() createLanguageDto: CreateLanguageDto,
    @UploadedFile()
    flagImage: Express.Multer.File,
  ) {
    if (!flagImage) {
      throw new BadRequestException('Flag image is required');
    }

    return {
      data: await this.languageService.create(createLanguageDto, flagImage),
      statusCode: HttpStatus.CREATED,
      message: 'Success create language',
    };
  }

  @Public()
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.languageService.findAll(paginationDto);

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get all languages',
    };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return {
      data: await this.languageService.findById(id),
      statusCode: HttpStatus.OK,
      message: 'Success get language by id',
    };
  }

  @Roles(Role.ADMIN)
  @Put(':id')
  @UseInterceptors(FileInterceptor('flag_image', uploadImage('flag')))
  async update(
    @UploadedFile()
    flagImage: Express.Multer.File,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateLanguageDto: UpdateLanguageDto,
  ) {
    return {
      data: await this.languageService.update(id, updateLanguageDto, flagImage),
      statusCode: HttpStatus.OK,
      message: 'Success update language',
    };
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.languageService.remove(id);
  }
}

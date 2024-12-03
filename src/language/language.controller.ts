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
import { CreateLanguageDto } from './dto/create-language.dto';
import { LanguageQueryDto } from './dto/query.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { LanguageService } from './language.service';

@ApiTags('Languages')
@Controller('languages')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createLanguageDto: CreateLanguageDto) {
    return {
      data: await this.languageService.create(createLanguageDto),
      statusCode: HttpStatus.CREATED,
      message: 'Success create language',
    };
  }

  @Post('/upload/flagImage')
  @UseInterceptors(FileInterceptor('flagImage', uploadImage('flag')))
  async uploadFlagImage(@UploadedFile() flagImage: Express.Multer.File) {
    if (typeof flagImage === 'undefined') {
      throw new BadRequestException('Flag image is not uploaded');
    }

    return {
      flagImage: flagImage?.filename,
    };
  }

  @Public()
  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() queryDto: LanguageQueryDto,
  ) {
    const result = await this.languageService.findAll(paginationDto, queryDto);

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
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateLanguageDto: UpdateLanguageDto,
  ) {
    return {
      data: await this.languageService.update(id, updateLanguageDto),
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

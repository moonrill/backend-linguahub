import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { LanguageService } from './language.service';
import { flagStorage } from './helpers/upload-flag';

@Controller('languages')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('flag_image', flagStorage))
  async create(
    @Body() createLanguageDto: CreateLanguageDto,
    @UploadedFile() flagImage: Express.Multer.File,
  ) {
    return {
      data: await this.languageService.create(createLanguageDto, flagImage),
      statusCode: HttpStatus.CREATED,
      message: 'Success create language',
    };
  }

  @Get()
  async findAll(@Query('order') order: string) {
    return {
      data: await this.languageService.findAll(order),
      statusCode: HttpStatus.OK,
      message: 'Success get all languages',
    };
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return {
      data: await this.languageService.findOne(id),
      statusCode: HttpStatus.OK,
      message: 'Success get language by id',
    };
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('flag_image', {
      storage: diskStorage({
        destination: 'uploads/public',
        filename: (req, file, cb) => {
          const timestamp = Date.now();

          cb(null, `flag-${timestamp}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async update(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /(jpg|jpeg|png)$/ })
        .addMaxSizeValidator({ maxSize: 3 * 1024 * 1024 })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: false,
        }),
    )
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

  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.languageService.remove(id);
  }
}

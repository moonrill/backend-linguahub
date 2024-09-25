import { Public } from '#/auth/strategies/public.strategy';
import { PaginationDto } from '#/utils/pagination.dto';
import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { SearchTranslatorDto } from './dto/search-translator.dto';
import { TranslatorService } from './translator.service';

@Controller('translators')
export class TranslatorController {
  constructor(private readonly translatorService: TranslatorService) {}

  @Public()
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.translatorService.findAll(paginationDto);

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get all translators',
    };
  }

  @Public()
  @Get('/service')
  async search(
    @Query() searchTranslatorDto: SearchTranslatorDto,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.translatorService.searchByService(
      searchTranslatorDto,
      paginationDto,
    );

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success search translator',
    };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return {
      data: await this.translatorService.findById(id),
      statusCode: HttpStatus.OK,
      message: 'Success get translator by id',
    };
  }
}

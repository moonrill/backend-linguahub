import { Role } from '#/auth/role.enum';
import { Roles } from '#/auth/roles.decorator';
import { Public } from '#/auth/strategies/public.strategy';
import { BookingQueryDto } from '#/booking/dto/query.dto';
import { ReviewQueryDto } from '#/review/dto/query.dto';
import { QueryServiceRequestDto } from '#/service-request/dto/query.dto';
import { PaginationDto } from '#/utils/pagination.dto';
import { translatorDocumentStorage } from '#/utils/upload-documents';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { RegistrationQueryDto } from './dto/registration-query.dto';
import { RejectTranslatorDto } from './dto/reject.dto';
import { SearchTranslatorDto } from './dto/search-translator.dto';
import { UpdateTranslatorDto } from './dto/update-translator.dto';
import { TranslatorStatus } from './entities/translator.entity';
import { TranslatorService } from './translator.service';

@ApiTags('Translators')
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
  @Get('search/service')
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

  @Get('/registrations')
  async registration(
    @Query() paginationDto: PaginationDto,
    @Query() registrationQueryDto: RegistrationQueryDto,
  ) {
    const result = await this.translatorService.getRegistration(
      paginationDto,
      registrationQueryDto,
    );

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get translator registration',
    };
  }

  @Get('services')
  async getServices(@Query() paginationDto: PaginationDto, @Request() req) {
    const result = await this.translatorService.getServices(
      paginationDto,
      req.user.translatorId,
    );

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get translator services',
    };
  }

  @Roles(Role.TRANSLATOR)
  @Get('service-requests')
  async getServiceRequests(
    @Request() req,
    @Query() paginationDto: PaginationDto,
    @Query() queryDto: QueryServiceRequestDto,
  ) {
    const result = await this.translatorService.getTranslatorServiceRequests(
      req.user.id,
      paginationDto,
      queryDto,
    );

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get translator service requests',
    };
  }

  @Roles(Role.TRANSLATOR)
  @Get('bookings')
  async getBookings(
    @Request() req,
    @Query() paginationDto: PaginationDto,
    @Query() queryDto: BookingQueryDto,
  ) {
    const result = await this.translatorService.getTranslatorBookings(
      req.user.id,
      paginationDto,
      queryDto,
    );

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get translator bookings',
    };
  }

  @Get('reviews')
  async getReviews(
    @Query() paginationDto: PaginationDto,
    @Query() queryDto: ReviewQueryDto,
    @Request() req,
  ) {
    const result = await this.translatorService.getTranslatorReviews(
      req.user.translatorId,
      queryDto,
      paginationDto,
    );

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get translator reviews',
    };
  }

  @Public()
  @Get('best')
  async getBestTranslator() {
    return {
      data: await this.translatorService.findBestTranslators(),
      statusCode: HttpStatus.OK,
      message: 'Success get best translator',
    };
  }

  @Get('languages')
  async getTranslatorLanguages(@Request() req) {
    return {
      data: await this.translatorService.getTranslatorLanguages(
        req.user.translatorId,
      ),
      statusCode: HttpStatus.OK,
      message: 'Success get translator languages',
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

  @Public()
  @Post('upload/cv')
  @UseInterceptors(FileInterceptor('cv', translatorDocumentStorage))
  async uploadCV(@UploadedFile() cv: Express.Multer.File) {
    if (typeof cv?.filename === 'undefined') {
      throw new BadRequestException('CV is not uploaded');
    }

    return {
      cv: cv?.filename,
    };
  }

  @Public()
  @Post('upload/certificate')
  @UseInterceptors(FileInterceptor('certificate', translatorDocumentStorage))
  async uploadCertificate(@UploadedFile() certificate: Express.Multer.File) {
    if (typeof certificate?.filename === 'undefined') {
      throw new BadRequestException('Certificate is not uploaded');
    }

    return {
      certificate: certificate?.filename,
    };
  }

  @Roles(Role.TRANSLATOR)
  @Put(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateTranslatorDto: UpdateTranslatorDto,
  ) {
    return {
      data: await this.translatorService.update(id, updateTranslatorDto),
      statusCode: HttpStatus.OK,
      message: 'Success update translator',
    };
  }

  @Roles(Role.ADMIN)
  @Put(':id/approve')
  async approve(@Param('id', new ParseUUIDPipe()) id: string) {
    return {
      data: await this.translatorService.updateTranslatorStatus(
        id,
        TranslatorStatus.APPROVED,
      ),
      statusCode: HttpStatus.OK,
      message: 'Success approve translator',
    };
  }

  @Roles(Role.ADMIN)
  @Put(':id/reject')
  async reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() rejectDto: RejectTranslatorDto,
  ) {
    const { reason } = rejectDto;

    return {
      data: await this.translatorService.updateTranslatorStatus(
        id,
        TranslatorStatus.REJECTED,
        reason,
      ),
      statusCode: HttpStatus.OK,
      message: 'Success reject translator',
    };
  }
}

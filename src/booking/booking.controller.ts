import { Role } from '#/auth/role.enum';
import { Roles } from '#/auth/roles.decorator';
import { PaginationDto } from '#/utils/pagination.dto';
import { uploadImage } from '#/utils/upload-image';
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { BookingQueryDto } from './dto/query.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() queryDto: BookingQueryDto,
  ) {
    const result = await this.bookingService.findAll(paginationDto, queryDto);

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get all bookings',
    };
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return {
      data: await this.bookingService.findById(id),
      statusCode: HttpStatus.OK,
      message: 'Success get booking by id',
    };
  }

  @Put(':id/proof')
  @UseInterceptors(FileInterceptor('proof', uploadImage('proof')))
  async uploadProof(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() proof: Express.Multer.File,
  ) {
    if (typeof proof?.filename === 'undefined') {
      throw new BadRequestException('Proof is not uploaded');
    }

    return await this.bookingService.updateProof(id, proof.filename);
  }

  @Roles(Role.CLIENT)
  @Put(':id/complete')
  async complete(@Param('id', new ParseUUIDPipe()) id: string, @Request() req) {
    return await this.bookingService.completeBooking(id, req.user.id);
  }

  @Put(':id/cancel')
  async cancel(@Param('id', new ParseUUIDPipe()) id: string, @Request() req) {
    return await this.bookingService.cancelBooking(id, req.user.id);
  }

  @Delete(':id/proof')
  async deleteProof(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.bookingService.deleteProof(id);
  }
}

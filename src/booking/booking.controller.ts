import { PaginationDto } from '#/utils/pagination.dto';
import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingQueryDto } from './dto/query.dto';

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
}

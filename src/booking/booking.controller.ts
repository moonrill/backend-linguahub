import { Role } from '#/auth/role.enum';
import { Roles } from '#/auth/roles.decorator';
import { PaginationDto } from '#/utils/pagination.dto';
import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  Request,
} from '@nestjs/common';
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

  @Roles(Role.CLIENT)
  @Put(':id/complete')
  async complete(@Param('id', new ParseUUIDPipe()) id: string, @Request() req) {
    return await this.bookingService.completeBooking(id, req.user.id);
  }

  @Put(':id/cancel')
  async cancel(@Param('id', new ParseUUIDPipe()) id: string, @Request() req) {
    return await this.bookingService.cancelBooking(id, req.user.id);
  }
}

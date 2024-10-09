import { Role } from '#/auth/role.enum';
import { Roles } from '#/auth/roles.decorator';
import { BookingQueryDto } from '#/booking/dto/query.dto';
import { QueryServiceRequestDto } from '#/service-request/dto/query.dto';
import { PaginationDto } from '#/utils/pagination.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserCouponsQueryDto } from './dto/coupon.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN)
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.usersService.findAll(paginationDto);

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get all users',
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return {
      data: await this.usersService.findById(id),
      statusCode: HttpStatus.OK,
      message: 'Success get user by id',
    };
  }

  @Roles(Role.CLIENT)
  @Get(':id/coupons')
  async getCoupons(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationDto: PaginationDto,
    @Query() userCouponsQueryDto: UserCouponsQueryDto,
  ) {
    const result = await this.usersService.getUserCoupons(
      id,
      paginationDto,
      userCouponsQueryDto,
    );

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get user coupons',
    };
  }

  @Roles(Role.CLIENT)
  @Get(':id/service-requests')
  async getServiceRequests(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationDto: PaginationDto,
    @Query() queryDto: QueryServiceRequestDto,
  ) {
    const result = await this.usersService.getUserServiceRequests(
      id,
      paginationDto,
      queryDto,
    );

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get user service requests',
    };
  }

  @Roles(Role.CLIENT)
  @Get(':id/bookings')
  async getBookings(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationDto: PaginationDto,
    @Query() queryDto: BookingQueryDto,
  ) {
    const result = await this.usersService.getUserBookings(
      id,
      paginationDto,
      queryDto,
    );

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get user bookings',
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return {
      data: await this.usersService.update(id, updateUserDto),
      statusCode: HttpStatus.OK,
      message: 'Success update user',
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.remove(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Success delete user',
    };
  }
}

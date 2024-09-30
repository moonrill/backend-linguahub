import { Role } from '#/auth/role.enum';
import { Roles } from '#/auth/roles.decorator';
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
  Request,
} from '@nestjs/common';
import { UserCouponsQueryDto } from './dto/coupon.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.usersService.findAll(paginationDto);

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get all users',
    };
  }

  @Roles(Role.CLIENT)
  @Get('coupons')
  async getCoupons(
    @Request() req,
    @Query() paginationDto: PaginationDto,
    @Query() userCouponsQueryDto: UserCouponsQueryDto,
  ) {
    const result = await this.usersService.getUserCoupons(
      req.user.id,
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
  @Get('service-requests')
  async getServiceRequests(@Request() req) {}

  @Roles(Role.CLIENT)
  @Get('bookings')
  async getBookings(@Request() req) {}

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return {
      data: await this.usersService.findById(id),
      statusCode: HttpStatus.OK,
      message: 'Success get user by id',
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

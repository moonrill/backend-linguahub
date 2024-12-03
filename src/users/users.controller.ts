import { Role } from '#/auth/role.enum';
import { Roles } from '#/auth/roles.decorator';
import { BookingQueryDto } from '#/booking/dto/query.dto';
import { PaymentQueryDto } from '#/payment/dto/query.dto';
import { ServiceRequestQueryDto } from '#/service-request/dto/query.dto';
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
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Roles(Role.CLIENT)
  @Get('coupons')
  async getCoupons(
    @Query() paginationDto: PaginationDto,
    @Query() userCouponsQueryDto: UserCouponsQueryDto,
    @Request() req,
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
  async getServiceRequests(
    @Query() paginationDto: PaginationDto,
    @Query() queryDto: ServiceRequestQueryDto,
    @Request() req,
  ) {
    const result = await this.usersService.getUserServiceRequests(
      req.user.id,
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
  @Get('bookings')
  async getBookings(
    @Query() paginationDto: PaginationDto,
    @Query() queryDto: BookingQueryDto,
    @Request() req,
  ) {
    const result = await this.usersService.getUserBookings(
      req.user.id,
      paginationDto,
      queryDto,
    );

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get user bookings',
    };
  }

  @Roles(Role.CLIENT)
  @Get('payments')
  async getPayments(
    @Query() paginationDto: PaginationDto,
    @Query() queryDto: PaymentQueryDto,
    @Request() req,
  ) {
    const result = await this.usersService.getUserPayments(
      req.user.id,
      paginationDto,
      queryDto,
    );

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get user bookings',
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

  @Post('upload/profile-picture')
  @UseInterceptors(
    FileInterceptor('profilePicture', uploadImage('profile-picture')),
  )
  async uploadProfilePicture(
    @UploadedFile() profilePicture: Express.Multer.File,
  ) {
    if (typeof profilePicture === 'undefined') {
      throw new BadRequestException('Profile picture is not uploaded');
    }

    return {
      profilePicture: profilePicture?.filename,
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

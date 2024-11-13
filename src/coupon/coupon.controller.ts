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
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { CouponQueryDto } from './dto/query.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@ApiTags('Coupon')
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  async create(@Body() createCouponDto: CreateCouponDto) {
    return {
      data: await this.couponService.create(createCouponDto),
      statusCode: HttpStatus.CREATED,
      message: 'Success create coupon',
    };
  }

  @Roles(Role.CLIENT)
  @Post('claim/:id')
  async claimCoupon(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req,
  ) {
    return {
      data: await this.couponService.claim(id, req.user.id),
      statusCode: HttpStatus.OK,
      message: 'Success claim coupon',
    };
  }

  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() couponQueryDto: CouponQueryDto,
  ) {
    const result = await this.couponService.findAll(
      paginationDto,
      couponQueryDto,
    );

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get all coupons',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return {
      data: await this.couponService.findById(id),
      statusCode: HttpStatus.OK,
      message: 'Success get coupon by id',
    };
  }

  @Roles(Role.ADMIN)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    return {
      data: await this.couponService.update(id, updateCouponDto),
      statusCode: HttpStatus.OK,
      message: 'Success update coupon',
    };
  }

  @Roles(Role.ADMIN)
  @Put(':id/status')
  async toggleStatus(@Param('id', new ParseUUIDPipe()) id: string) {
    return {
      data: await this.couponService.toggleStatus(id),
      statusCode: HttpStatus.OK,
      message: 'Success update coupon status',
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.couponService.remove(id);
  }
}

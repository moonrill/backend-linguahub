import { Public } from '#/auth/strategies/public.strategy';
import { PaginationDto } from '#/utils/pagination.dto';
import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PaymentQueryDto } from './dto/query.dto';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Public()
  @Post('/notification-handler')
  async midtransNotification(@Request() req) {
    return await this.paymentService.updatePaymentStatus(req.body);
  }

  // @Roles(Role.CLIENT)
  @Post('/client/:bookingId')
  async create(
    @Param('bookingId', new ParseUUIDPipe()) bookingId: string,
    @Request() req,
  ) {
    return {
      data: await this.paymentService.create(bookingId, req.user.id),
      statusCode: HttpStatus.CREATED,
      message: 'Success create payment',
    };
  }

  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() queryDto: PaymentQueryDto,
  ) {
    const result = await this.paymentService.findAll(paginationDto, queryDto);

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get all payments',
    };
  }

  @Public()
  @Get('/invoice/:id')
  async generateInvoice(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() res: Response,
  ) {
    return await this.paymentService.generateInvoice(id, res);
  }

  @Get(':id')
  async findOne(@Query('id') id: string) {
    return {
      data: await this.paymentService.findById(id),
      statusCode: HttpStatus.OK,
      message: 'Success get payment by id',
    };
  }
}

import { PaginationDto } from '#/utils/pagination.dto';
import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return {
      data: await this.paymentService.create(createPaymentDto),
      statusCode: HttpStatus.CREATED,
      message: 'Success create payment',
    };
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.paymentService.findAll(paginationDto);

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get all payments',
    };
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

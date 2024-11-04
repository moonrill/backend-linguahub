import { Public } from '#/auth/strategies/public.strategy';
import { PaginationDto } from '#/utils/pagination.dto';
import { uploadImage } from '#/utils/upload-image';
import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Request,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Put(':id/proof')
  @UseInterceptors(FileInterceptor('proof', uploadImage('proof/payment')))
  async uploadProof(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() proof: Express.Multer.File,
  ) {
    if (typeof proof?.filename === 'undefined') {
      throw new BadRequestException('Proof is not uploaded');
    }

    return await this.paymentService.updatePaymentProof(id, proof.filename);
  }
}

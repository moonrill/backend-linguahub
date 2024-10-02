import { Role } from '#/auth/role.enum';
import { Roles } from '#/auth/roles.decorator';
import { PaginationDto } from '#/utils/pagination.dto';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/query.dto';
import { ReviewService } from './review.service';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() queryDto: ReviewQueryDto,
  ) {
    const result = await this.reviewService.findAll(paginationDto, queryDto);

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get all reviews',
    };
  }

  @Roles(Role.CLIENT)
  @Post(':id')
  async create(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() createReviewDto: CreateReviewDto,
    @Request() req,
  ) {
    return {
      data: await this.reviewService.create(id, req.user.id, createReviewDto),
      statusCode: HttpStatus.CREATED,
      message: 'Success create review',
    };
  }
}

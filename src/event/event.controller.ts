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
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateEventDto } from './dto/create-event.dto';
import { EventQueryDto } from './dto/query.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventService } from './event.service';

@Controller('events')
export class EventController {
  private readonly basePosterUrl: string;

  constructor(private readonly eventService: EventService) {}

  @Post()
  @UseInterceptors(FileInterceptor('poster', uploadImage('poster')))
  async create(
    @UploadedFile() poster: Express.Multer.File,
    @Body() createEventDto: CreateEventDto,
  ) {
    if (!poster) {
      throw new BadRequestException('Poster is required');
    }

    return {
      data: await this.eventService.create(createEventDto, poster),
      statusCode: HttpStatus.CREATED,
      message: 'Success create event',
    };
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('poster', uploadImage('poster')))
  async update(
    @Param('id') id: string,
    @UploadedFile() poster: Express.Multer.File,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return {
      data: await this.eventService.update(id, updateEventDto, poster),
      statusCode: HttpStatus.OK,
      message: 'Success update event',
    };
  }

  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() eventQueryDto: EventQueryDto,
  ) {
    const result = await this.eventService.findAll(
      paginationDto,
      eventQueryDto,
    );

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get all events',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return {
      data: await this.eventService.findById(id),
      statusCode: HttpStatus.OK,
      message: 'Success get event by id',
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.eventService.remove(id);
  }
}

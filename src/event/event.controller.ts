import { Public } from '#/auth/strategies/public.strategy';
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { CreateEventDto } from './dto/create-event.dto';
import { EventQueryDto } from './dto/query.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventService } from './event.service';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  async create(@Body() createEventDto: CreateEventDto) {
    return {
      data: await this.eventService.create(createEventDto),
      statusCode: HttpStatus.CREATED,
      message: 'Success create event',
    };
  }

  @Post('/upload/poster')
  @UseInterceptors(FileInterceptor('poster', uploadImage('poster')))
  async uploadPoster(@UploadedFile() poster: Express.Multer.File) {
    if (typeof poster === 'undefined') {
      throw new BadRequestException('Poster is not uploaded');
    }

    return {
      poster: poster?.filename,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return {
      data: await this.eventService.update(id, updateEventDto),
      statusCode: HttpStatus.OK,
      message: 'Success update event',
    };
  }

  @Public()
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

  @Public()
  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
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

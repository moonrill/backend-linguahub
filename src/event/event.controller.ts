import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './event.entity';

@Controller('event')
export class EventController {
  private readonly basePosterUrl: string;

  constructor(
    private readonly eventService: EventService,
    private readonly configService: ConfigService,
  ) {
    // Base URL for accessing posters
    this.basePosterUrl = this.configService.get<string>(
      'POSTER_BASE_URL',
      'http://localhost:3222/images/poster/',
    );
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('poster', {
      storage: diskStorage({
        destination: './uploads/images/poster', 
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createEventDto: CreateEventDto,
  ): Promise<Event> {
    if (file) {
      createEventDto.poster = file.filename; 
    }
    const event = await this.eventService.create(createEventDto);
    event.poster = `${this.basePosterUrl}${event.poster}`; 
    return event;
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('poster', {
      storage: diskStorage({
        destination: './uploads/images/poster', 
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    const existingEvent = await this.eventService.findOne(id);

    if (!existingEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    if (file) {
      // If there's a new poster, update it
      updateEventDto.poster = file.filename;
    } else {
      // If no new poster, keep the old one
      updateEventDto.poster = existingEvent.poster;
    }

    const updatedEvent = await this.eventService.update(id, updateEventDto);
    updatedEvent.poster = `${this.basePosterUrl}${updatedEvent.poster}`; 
    return updatedEvent;
  }

  @Get()
  async findAll(): Promise<Event[]> {
    const events = await this.eventService.findAll();
    events.forEach(event => {
      event.poster = `${this.basePosterUrl}${event.poster}`; 
    });
    return events;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Event> {
    const event = await this.eventService.findOne(id);
    event.poster = `${this.basePosterUrl}${event.poster}`; 
    return event;
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.eventService.remove(id);
  }
}

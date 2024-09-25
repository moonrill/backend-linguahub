import { Controller, Get, Post, Put, Delete, UseInterceptors, UploadedFile, Body, Param, Patch } from '@nestjs/common';
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './event.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as path from 'path'; 
import { ConfigService } from '@nestjs/config'; 

@Controller('event')
export class EventController {
  private readonly basePosterUrl: string;

  constructor(
    private readonly eventService: EventService,
    private readonly configService: ConfigService,
  ) {
    this.basePosterUrl = this.configService.get<string>('POSTER_BASE_URL', 'http://localhost:3222/poster/');
  }

  @Post()
  @UseInterceptors(FileInterceptor('poster', {
    storage: diskStorage({
      destination: path.join(__dirname, '../../src/event/poster'),
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  async create(@UploadedFile() file: Express.Multer.File, @Body() createEventDto: CreateEventDto): Promise<Event> {
    if (file) {
      createEventDto.poster = file.filename; 
    }
    const event = await this.eventService.create(createEventDto);
    event.poster = `${this.basePosterUrl}${event.poster}`;
    return event;
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('poster', {
    storage: diskStorage({
      destination: path.join(__dirname, '../../src/event/poster'),
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  async update(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Body() updateEventDto: UpdateEventDto): Promise<Event> {
    const existingEvent = await this.eventService.findOne(id);
    
    if (!existingEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    
    if (file) {
      // Jika ada file poster baru, simpan nama file baru
      updateEventDto.poster = file.filename;
    } else {
      // Jika tidak ada file baru, gunakan poster yang lama
      updateEventDto.poster = existingEvent.poster;
    }
  
    const updatedEvent = await this.eventService.update(id, updateEventDto);
  
    updatedEvent.poster = `${this.basePosterUrl}${updatedEvent.poster}`;
    return updatedEvent;
  }
  @Get()
  async findAll(): Promise<Event[]> {
    const events = await this.eventService.findAll();
    events.forEach(event => event.poster = `${this.basePosterUrl}${event.poster}`);
    return events;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Event> {
    const event = await this.eventService.findOne(id);
    event.poster = `${this.basePosterUrl}${event.poster}`;
    return event;
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.eventService.remove(id);
  }
}

import { Controller, Get, Post, Put, Delete, UseInterceptors, UploadedFile, Body, Param, Patch } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './event.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as path from 'path'; 

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

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
      createEventDto.poster = file.filename; // Save the filename of the poster
    }
    return this.eventService.create(createEventDto);
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
  async updatePut(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Body() updateEventDto: UpdateEventDto): Promise<Event> {
    if (file) {
      updateEventDto.poster = file.filename; // Save the filename of the poster if new one is uploaded
    }
    return this.eventService.update(id, updateEventDto);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('poster', {
    storage: diskStorage({
      destination: path.join(__dirname, '../../src/event/poster'),
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  async updatePatch(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Body() updateEventDto: UpdateEventDto): Promise<Event> {
    if (file) {
      updateEventDto.poster = file.filename; // Update poster filename if a new file is uploaded
    }
    return this.eventService.update(id, updateEventDto);
  }

  @Get()
  findAll(): Promise<Event[]> {
    return this.eventService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Event> {
    return this.eventService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.eventService.remove(id);
  }
}

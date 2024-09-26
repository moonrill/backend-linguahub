import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './event.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create(createEventDto);
    return this.eventRepository.save(event);
  }

  findAll(): Promise<Event[]> {
    return this.eventRepository.find();
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.eventRepository.preload({
      id,
      ...updateEventDto,
    });
  
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
  
    // Simpan event dengan poster lama jika poster tidak diperbarui
    return this.eventRepository.save(event);
  }
  async remove(id: string): Promise<void> {
    const event = await this.eventRepository.findOne({ where: { id } });
    
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
  
    if (event.poster) {
      const posterPath = path.join(__dirname, '..', '..', 'uploads', 'images', 'poster', event.poster);
      try {
        if (fs.existsSync(posterPath)) {
          fs.unlinkSync(posterPath);
        }
      } catch (error) {
        console.error(`Failed to delete poster file: ${error.message}`);
        throw new InternalServerErrorException(`Error deleting poster file`);
      }
    }
  
    try {
      await this.eventRepository.remove(event);
    } catch (error) {
      console.error(`Failed to delete event: ${error.message}`);
      throw new InternalServerErrorException(`Error deleting event`);
    }
  }
}
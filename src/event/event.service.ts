import { Injectable, NotFoundException } from '@nestjs/common';
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
    const event = await this.eventRepository.findOne({ where: { id } });
    
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Update existing fields
    Object.assign(event, updateEventDto);

    // Handle poster update and delete old one
    if (updateEventDto.poster) {
      // Delete old poster if exists
      if (event.poster) {
        const oldPosterPath = path.join(__dirname, '..', '..', 'src', 'event', 'poster', event.poster);
        if (fs.existsSync(oldPosterPath)) {
          fs.unlinkSync(oldPosterPath); // Delete old poster
        }
      }
      event.poster = updateEventDto.poster; // Assign new poster filename
    }

    return this.eventRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Remove associated poster file if exists
    if (event.poster) {
      const posterPath = path.join(__dirname, '..', '..', 'src', 'event', 'poster', event.poster);
      if (fs.existsSync(posterPath)) {
        fs.unlinkSync(posterPath);
      }
    }

    await this.eventRepository.remove(event);
  }
}

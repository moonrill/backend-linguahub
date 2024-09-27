import { PaginationDto } from '#/utils/pagination.dto';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, LessThan, MoreThan, Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { EventQueryDto, EventStatus } from './dto/query.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private configService: ConfigService,
  ) {}

  async create(createEventDto: CreateEventDto, poster: Express.Multer.File) {
    try {
      const entity = new Event();

      entity.name = createEventDto.name;
      entity.description = createEventDto.description;
      entity.startDate = createEventDto.startDate;
      entity.endDate = createEventDto.endDate;

      const baseUrl = this.configService.get<string>('BASE_URL');
      entity.poster = `${baseUrl}/images/poster/${poster.filename}`;

      const result = await this.eventRepository.insert(entity);

      return this.eventRepository.findOneOrFail({
        where: {
          id: result.identifiers[0].id,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto, eventQueryDto: EventQueryDto) {
    try {
      const { page, limit } = paginationDto;
      const currentDate = new Date();

      let whereClause = {};

      switch (eventQueryDto.status) {
        case EventStatus.ONGOING:
          whereClause = {
            startDate: LessThan(currentDate),
            endDate: MoreThan(currentDate),
          };
          break;
        case EventStatus.UPCOMING:
          whereClause = { startDate: MoreThan(currentDate) };
          break;
        case EventStatus.PAST:
          whereClause = { endDate: LessThan(currentDate) };
          break;
      }

      const [data, total] = await this.eventRepository.findAndCount({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        relations: ['coupons'],
        order: { startDate: 'ASC' },
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        totalPages,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const data = await this.eventRepository.findOneOrFail({
        where: { id },
        relations: ['coupons'],
      });

      return data;
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new NotFoundException('Event not found');
      } else {
        throw e;
      }
    }
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    poster: Express.Multer.File,
  ) {
    const oldData = await this.findById(id);

    const newEvent = new Event();

    newEvent.name = updateEventDto.name;
    newEvent.description = updateEventDto.description;
    newEvent.startDate = updateEventDto.startDate;
    newEvent.endDate = updateEventDto.endDate;

    if (poster) {
      const baseUrl = this.configService.get<string>('BASE_URL');
      newEvent.poster = `${baseUrl}/images/poster/${poster.filename}`;
    } else {
      newEvent.poster = oldData.poster;
    }

    await this.eventRepository.update(id, newEvent);

    return this.findById(id);
  }

  async remove(id: string) {
    try {
      await this.findById(id);

      await this.eventRepository.softDelete(id);

      return {
        statusCode: HttpStatus.OK,
        message: 'Success delete event',
      };
    } catch (error) {
      throw error;
    }
  }
}

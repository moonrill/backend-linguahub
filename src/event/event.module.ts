import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { EventController } from './event.controller';
import { EventService } from './event.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  providers: [EventService],
  controllers: [EventController],
})
export class EventModule {}

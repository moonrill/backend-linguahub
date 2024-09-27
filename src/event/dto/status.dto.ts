import { IsEnum } from 'class-validator';

export enum EventStatus {
  ONGOING = 'ongoing',
  UPCOMING = 'upcoming',
  PAST = 'past',
}

export class EventStatusDto {
  @IsEnum(EventStatus)
  status: EventStatus = EventStatus.ONGOING;
}

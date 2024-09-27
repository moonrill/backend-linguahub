import { IsEnum, IsOptional } from 'class-validator';

export enum EventStatus {
  ONGOING = 'ongoing',
  UPCOMING = 'upcoming',
  PAST = 'past',
}

export class EventQueryDto {
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;
}

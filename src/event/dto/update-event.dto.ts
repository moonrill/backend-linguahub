import { PartialType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CreateEventDto } from './create-event.dto';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @IsOptional()
  poster?: string;
}

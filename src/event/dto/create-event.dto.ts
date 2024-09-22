import { IsString, IsDateString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsString()
  poster: string;
}

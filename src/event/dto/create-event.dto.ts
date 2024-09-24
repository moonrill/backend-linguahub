import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsDateString()
  start_date: string;

  @IsNotEmpty()
  @IsDateString()
  end_date: string;

  // @IsString() 
  // poster: string;
  poster?: string; 
}

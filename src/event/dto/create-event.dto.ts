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

<<<<<<< HEAD
  // @IsString()
  poster: string;
=======
  // @IsString() 
  // poster: string;
  poster?: string; 
>>>>>>> 830a0d219f492a0d79e4d9277b75e455aee2a32e
}

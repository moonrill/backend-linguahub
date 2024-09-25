import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateEventDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    start_date?: string;

    @IsOptional()
    @IsDateString()
    end_date?: string;

    @IsOptional()
    @IsString()
    poster?: string;
<<<<<<< HEAD
}
=======
}
>>>>>>> 830a0d219f492a0d79e4d9277b75e455aee2a32e

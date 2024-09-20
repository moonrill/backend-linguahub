import { Type } from 'class-transformer';
import { IsDate, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { Gender } from '../entities/user-detail.entity';

export class UpdateUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  fullName: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsDate()
  @Type(() => Date)
  dateOfBirth: Date;

  @IsOptional()
  phoneNumber: string;

  @IsOptional()
  province: string;

  @IsOptional()
  city: string;

  @IsOptional()
  district: string;

  @IsOptional()
  subDistrict: string;

  @IsOptional()
  street: string;
}

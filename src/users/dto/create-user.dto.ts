import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Gender } from '../entities/user-detail.entity';

export class CreateUserDto {
  @IsNotEmpty()
  role: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  fullName: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  dateOfBirth: Date;

  @IsNotEmpty()
  @MaxLength(13)
  phoneNumber: string;

  @IsNotEmpty()
  province: string;

  @IsNotEmpty()
  city: string;

  @IsNotEmpty()
  district: string;

  @IsNotEmpty()
  subDistrict: string;

  @IsNotEmpty()
  street: string;

  @IsNumber()
  @ValidateIf((o) => o.role === 'translator')
  @IsNotEmpty()
  @Type(() => Number)
  yearsOfExperience?: number;

  @ValidateIf((o) => o.role === 'translator')
  @IsNotEmpty()
  portfolioLink?: string;

  @ValidateIf((o) => o.role === 'translator')
  @IsNotEmpty()
  bank?: string;

  @ValidateIf((o) => o.role === 'translator')
  @IsNotEmpty()
  bankAccountNumber?: string;

  @IsArray()
  @IsUUID('4', {
    each: true,
    message: 'Each language must be a valid UUID',
  })
  @ValidateIf((o) => o.role === 'translator')
  @ArrayMinSize(2, { message: 'Must have at least 2 languages' })
  @ArrayUnique()
  languages?: string[];

  @IsArray()
  @IsUUID('4', {
    each: true,
    message: 'Each specialization must be a valid UUID',
  })
  @ValidateIf((o) => o.role === 'translator')
  @ArrayMinSize(1, { message: 'Must have at least 1 specialization' })
  @ArrayUnique()
  specializations?: string[];

  @ValidateIf((o) => o.role === 'translator')
  @IsNotEmpty()
  cv: string;

  @ValidateIf((o) => o.role === 'translator')
  @IsNotEmpty()
  certificate: string;
}

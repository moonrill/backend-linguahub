import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Gender } from '../entities/user-detail.entity';

export class CreateUserDto {
  @IsEnum(['client', 'translator'])
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

  // TODO: Handle language and specialization selection
  // @IsArray()
  // @IsString({ each: true })
  // @ValidateIf((o) => o.role === 'translator')
  // @IsNotEmpty({ message: 'Languages are required for translators' })
  // languages?: string[];

  // @IsArray()
  // @IsString({ each: true })
  // @ValidateIf((o) => o.role === 'translator')
  // @IsNotEmpty({ message: 'Specialities are required for translators' })
}

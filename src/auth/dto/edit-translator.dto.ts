import { CreateUserDto } from '#/users/dto/create-user.dto';
import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class EditTranslatorDto extends PartialType(CreateUserDto) {
  @IsNotEmpty()
  @IsUUID()
  translatorId: string;

  @IsOptional()
  password?: string;
}

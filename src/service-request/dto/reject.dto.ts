import { IsNotEmpty } from 'class-validator';

export class RejectServiceRequestDto {
  @IsNotEmpty()
  reason: string;
}

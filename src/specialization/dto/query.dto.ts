import { IsEnum, IsOptional } from 'class-validator';

enum SpecializationOrderBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
}

export class SpecializationQueryDto {
  @IsOptional()
  @IsEnum(SpecializationOrderBy)
  orderBy: SpecializationOrderBy = SpecializationOrderBy.NAME;

  @IsOptional()
  direction: 'ASC' | 'DESC' = 'ASC';
}

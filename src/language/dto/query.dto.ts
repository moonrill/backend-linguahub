import { IsEnum, IsOptional } from 'class-validator';

enum LanguageOrderBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
}

export class LanguageQueryDto {
  @IsOptional()
  @IsEnum(LanguageOrderBy)
  orderBy: LanguageOrderBy = LanguageOrderBy.NAME;

  @IsOptional()
  direction: 'ASC' | 'DESC' = 'ASC';
}

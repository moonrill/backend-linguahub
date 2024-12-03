import { IsEnum, IsNotEmpty } from 'class-validator';

export enum TranslatorSortBy {
  PRICE = 'price',
  RATING = 'rating',
  MOST_REVIEWED = 'mostReviewed',
}

export class SearchTranslatorDto {
  @IsNotEmpty()
  sourceLanguage: string;

  @IsNotEmpty()
  targetLanguage: string;

  @IsNotEmpty()
  @IsEnum(TranslatorSortBy)
  sortBy: TranslatorSortBy;
}

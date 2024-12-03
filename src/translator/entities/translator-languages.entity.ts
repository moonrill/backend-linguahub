import { Language } from '#/language/entities/language.entity';
import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Translator } from './translator.entity';

@Entity({ name: 'translator_languages' })
export class TranslatorLanguages {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Translator, (translator) => translator.translatorLanguages, {
    onDelete: 'CASCADE',
  })
  translator: Translator;

  @ManyToOne(() => Language, (language) => language.translatorLanguages, {
    onDelete: 'CASCADE',
  })
  language: Language;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
    nullable: false,
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
    nullable: false,
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  deletedAt: Date;
}

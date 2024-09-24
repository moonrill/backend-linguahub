import { TranslatorLanguages } from '#/translator/entities/translator-languages.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Language {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'char',
    length: 3,
    unique: true,
  })
  code: string;

  @Column({
    name: 'flag_image',
    nullable: true,
  })
  flagImage: string;

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

  @OneToMany(
    () => TranslatorLanguages,
    (translatorLanguage) => translatorLanguage.language,
  )
  translatorLanguages: TranslatorLanguages[];
}

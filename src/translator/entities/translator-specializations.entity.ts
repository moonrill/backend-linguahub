import { Specialization } from '#/specialization/entities/specialization.entity';
import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Translator } from './translator.entity';

@Entity({ name: 'translator_specializations' })
export class TranslatorSpecializations {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => Translator,
    (translator) => translator.translatorSpecializations,
    { onDelete: 'CASCADE' },
  )
  translator: Translator;

  @ManyToOne(
    () => Specialization,
    (specialization) => specialization.translatorSpecializations,
    {
      onDelete: 'CASCADE',
    },
  )
  specialization: Specialization;

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

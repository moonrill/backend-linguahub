import { Language } from '#/language/entities/language.entity';
import { Translator } from '#/translator/entities/translator.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ServiceStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity()
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ServiceStatus,
  })
  status: ServiceStatus;

  @Column({
    name: 'price_per_hour',
    type: 'int',
  })
  pricePerHour: number;

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

  @ManyToOne(() => Translator, (translator) => translator.services, {
    onDelete: 'CASCADE',
  })
  translator: Translator;

  @ManyToOne(() => Language, (language) => language.sourceServices)
  sourceLanguage: Language;

  @ManyToOne(() => Language, (language) => language.targetServices)
  targetLanguage: Language;
}

import { Review } from '#/review/entities/review.entity';
import { Service } from '#/service/entities/service.entity';
import { User } from '#/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TranslatorLanguages } from './translator-languages.entity';
import { TranslatorSpecializations } from './translator-specializations.entity';

export enum TranslatorStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

@Entity()
export class Translator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TranslatorStatus,
  })
  status: TranslatorStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  bio: string;

  @Column({
    type: 'decimal',
    default: 0.0,
  })
  rating: number;

  @Column({
    name: 'portfolio_link',
  })
  portfolioLink: string;

  @Column({
    name: 'years_of_experience',
    type: 'smallint',
  })
  yearsOfExperience: number;

  @Column({
    name: 'bank',
  })
  bank: string;

  @Column({
    name: 'bank_account_number',
  })
  bankAccountNumber: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  cv: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  certificate: string;

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

  @OneToOne(() => User, (user) => user.translator, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(
    () => TranslatorLanguages,
    (translatorLanguages) => translatorLanguages.translator,
  )
  translatorLanguages: TranslatorLanguages[];

  @OneToMany(
    () => TranslatorSpecializations,
    (specialization) => specialization.translator,
  )
  translatorSpecializations: TranslatorSpecializations[];

  @OneToMany(() => Service, (service) => service.translator, {
    onDelete: 'CASCADE',
  })
  services: Service[];

  @OneToMany(() => Review, (review) => review.translator)
  reviews: Review[];
}

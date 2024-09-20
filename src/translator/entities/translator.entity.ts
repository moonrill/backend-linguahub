import { User } from '#/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TranslatorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
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

  @OneToOne(() => User, (user) => user.translator)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

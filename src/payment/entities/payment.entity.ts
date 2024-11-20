import { Booking } from '#/booking/entities/booking.entity';
import { Translator } from '#/translator/entities/translator.entity';
import { User } from '#/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUND = 'refund',
}

export enum PaymentType {
  CLIENT = 'client',
  TRANSLATOR = 'translator',
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
  })
  status: PaymentStatus;

  @Column({
    type: 'int',
  })
  amount: number;

  @Column({
    name: 'payment_method',
    nullable: true,
  })
  paymentMethod: string;

  @Column({
    name: 'payment_type',
    type: 'enum',
    enum: PaymentType,
  })
  paymentType: PaymentType;

  @Column({
    nullable: true,
  })
  token: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  proof: string;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    nullable: false,
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    nullable: false,
  })
  updatedAt: Date;

  @DeleteDateColumn({
    type: 'timestamp with time zone',
    nullable: true,
  })
  deletedAt: Date;

  @ManyToOne(() => User, (user) => user.payments)
  user: User;

  @ManyToOne(() => Translator, (translator) => translator.payments)
  translator: Translator;

  @ManyToOne(() => Booking, (booking) => booking.payments, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  booking: Booking;
}

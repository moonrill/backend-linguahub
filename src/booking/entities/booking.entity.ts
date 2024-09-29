import { Coupon } from '#/coupon/entities/coupon.entity';
import { Service } from '#/service/entities/service.entity';
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

export enum BookingStatus {
  PENDING = 'pending',
  REJECTED = 'rejected',
  UNPAID = 'unpaid',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  CANCELLED = 'cancelled',
}

@Entity()
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'booking_date',
    type: 'date',
  })
  bookingDate: Date;

  @Column({
    name: 'start_at',
    type: 'time with time zone',
  })
  startAt: string;

  @Column({
    name: 'end_at',
    type: 'time with time zone',
  })
  endAt: string;

  @Column({
    type: 'decimal',
  })
  duration: number;

  @Column({
    type: 'enum',
    enum: BookingStatus,
  })
  status: BookingStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes: string;

  @Column({
    type: 'text',
  })
  location: string;

  @Column({
    name: 'service_fee',
    type: 'int',
  })
  serviceFee: number;

  @Column({
    name: 'system_fee',
    type: 'int',
  })
  systemFee: number;

  @Column({
    name: 'discount_amount',
    type: 'int',
    nullable: true,
  })
  discountAmount: number;

  @Column({
    name: 'total_price',
    type: 'int',
  })
  totalPrice: number;

  @Column({
    name: 'rejection_reason',
    type: 'text',
    nullable: true,
  })
  rejectionReason: string;

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

  @ManyToOne(() => User, (user) => user.bookings)
  user: User;

  @ManyToOne(() => Translator, (translator) => translator.bookings)
  translator: Translator;

  @ManyToOne(() => Service, (service) => service.bookings)
  service: Service;

  @ManyToOne(() => Coupon, (coupon) => coupon.bookings)
  coupon: Coupon;
}

import { Coupon } from '#/coupon/entities/coupon.entity';
import { Payment } from '#/payment/entities/payment.entity';
import { Review } from '#/review/entities/review.entity';
import { Service } from '#/service/entities/service.entity';
import { Translator } from '#/translator/entities/translator.entity';
import { User } from '#/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BookingRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum BookingStatus {
  UNPAID = 'unpaid',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
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
    name: 'request_status',
    type: 'enum',
    enum: BookingRequestStatus,
    default: BookingRequestStatus.PENDING,
  })
  requestStatus: BookingRequestStatus;

  @Column({
    name: 'booking_status',
    type: 'enum',
    enum: BookingStatus,
    nullable: true,
  })
  bookingStatus: BookingStatus;

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

  @Column({
    type: 'text',
    nullable: true,
  })
  proof: string;

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

  @OneToOne(() => Review, (review) => review.booking)
  @JoinColumn({ name: 'review_id' })
  review: Review;

  @OneToMany(() => Payment, (payment) => payment.booking)
  payments: Payment[];
}

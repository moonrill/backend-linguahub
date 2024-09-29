import { Booking } from '#/booking/entities/booking.entity';
import { Event } from '#/event/entities/event.entity';
import { UserCoupons } from '#/users/entities/user-coupons.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CouponStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity()
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: CouponStatus,
    default: CouponStatus.ACTIVE,
  })
  status: string;

  @Column({
    name: 'expired_at',
    type: 'timestamp with time zone',
  })
  expiredAt: Date;

  @Column({
    name: 'discount_percentage',
    type: 'int',
  })
  discountPercentage: number;

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

  @ManyToOne(() => Event, (event) => event.coupons, { onDelete: 'CASCADE' })
  event: Event;

  @OneToMany(() => UserCoupons, (userCoupon) => userCoupon.coupon)
  userCoupons: UserCoupons[];

  @OneToMany(() => Booking, (booking) => booking.coupon)
  bookings: Booking[];
}

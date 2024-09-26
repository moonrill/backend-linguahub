import { Coupon } from '#/coupon/entities/coupon.entity';
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
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, default: 'Untitled Event' })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  start_date: string;

  @Column({ nullable: true })
  end_date: string;

  @Column('text', { nullable: true })
  poster: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @OneToMany(() => Coupon, (coupon) => coupon.event)
  coupons: Coupon[];
}

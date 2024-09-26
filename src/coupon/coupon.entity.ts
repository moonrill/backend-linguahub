import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Event } from 'src/event/event.entity';

@Entity()
export class Coupon {


  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, event => event.coupons, { onDelete: 'CASCADE' })
  event: Event;

  @Column({ length: 255 })
  name: string;

  @Column('text')
  description: string;

  @Column('enum', { enum: ['Active', 'Inactive'], default: 'Active' })
  status: string;

  @Column('date')
  expired_at: Date;

  @Column('int')
  discount_percentage: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
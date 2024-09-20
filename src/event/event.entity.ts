import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Coupon } from 'src/coupon/coupon.entity';

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

  @Column({ nullable: true })
  poster: string;
}

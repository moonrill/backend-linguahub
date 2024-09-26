import { Booking } from '#/booking/entities/booking.entity';
import { Review } from '#/review/entities/review.entity';
import { Role } from '#/role/entities/role.entity';
import { Translator } from '#/translator/entities/translator.entity';
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
import { UserDetail } from './user-detail.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  salt: string;

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

  @ManyToOne(() => Role, (role) => role.user)
  role: Role;

  @OneToOne(() => UserDetail, (userDetail) => userDetail.user, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_detail_id' })
  userDetail: UserDetail;

  @OneToOne(() => Translator, (translator) => translator.user, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'translator_id' })
  translator: Translator;

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];
}

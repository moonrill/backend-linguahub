import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

@Entity({ name: 'user_detail' })
export class UserDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'full_name',
  })
  fullName: string;

  @Column({
    type: 'enum',
    enum: Gender,
  })
  gender: Gender;

  @Column({
    name: 'date_of_birth',
    type: 'date',
  })
  dateOfBirth: Date;

  @Column({
    name: 'phone_number',
    length: 13,
  })
  phoneNumber: string;

  @Column({
    name: 'profile_picture',
    type: 'text',
    nullable: true,
  })
  profilePicture: string;

  @Column()
  province: string;

  @Column()
  city: string;

  @Column()
  district: string;

  @Column({
    name: 'sub_district',
  })
  subDistrict: string;

  @Column({
    type: 'text',
  })
  street: string;

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

  @OneToOne(() => User, (user) => user.userDetail)
  user: User;
}

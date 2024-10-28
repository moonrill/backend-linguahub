import { TranslatorStatus } from '#/translator/entities/translator.entity';
import { TranslatorService } from '#/translator/translator.service';
import { CreateUserDto } from '#/users/dto/create-user.dto';
import { User } from '#/users/entities/user.entity';
import { UsersService } from '#/users/users.service';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
    private translatorService: TranslatorService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.create(createUserDto);

      return user;
    } catch (error) {
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.userRepository.findOne({
        where: { email: loginDto.email },
        relations: {
          role: true,
          userDetail: true,
          translator: true,
        },
        select: ['id', 'email', 'password', 'role', 'translator', 'userDetail'],
      });

      if (!user) {
        throw new UnauthorizedException('Incorrect email or password provided');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Incorrect email or password provided');
      }

      if (user.role.name === 'translator') {
        if (user.translator.status === TranslatorStatus.PENDING) {
          throw new UnauthorizedException(
            'Your registration is pending approval by the admin. You will be notified once your registration is approved.',
          );
        }

        if (user.translator.status === TranslatorStatus.REJECTED) {
          throw new UnauthorizedException(
            'Your registration has been rejected. Please check your email for more information.',
          );
        }
      }

      const payload = {
        id: user.id,
        email: user.email,
        role: user.role.name,
      };

      if (user.role.name === 'translator') {
        payload['translatorId'] = user.translator.id;
      }

      if (user.role.name !== 'admin') {
        payload['fullName'] = user.userDetail.fullName;
        payload['profilePicture'] = user.userDetail.profilePicture;
      }

      const accessToken = await this.jwtService.signAsync(payload);

      return { accessToken };
    } catch (error) {
      throw error;
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    try {
      const user = await this.userRepository.findOneOrFail({
        where: { id: userId },
        relations: ['role'],
        select: ['id', 'password', 'salt', 'role'],
      });
      const isPasswordValid = await bcrypt.compare(
        changePasswordDto.oldPassword,
        user.password,
      );

      if (!isPasswordValid) {
        throw new BadRequestException('Incorrect password provided');
      }

      if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      const newSalt = await bcrypt.genSalt();

      user.salt = newSalt;
      user.password = await bcrypt.hash(changePasswordDto.newPassword, newSalt);

      await this.userRepository.update(user.id, user);

      const { password, salt, ...rest } = user;

      return rest;
    } catch (error) {
      throw error;
    }
  }

  async getProfile(userId: string) {
    try {
      let result;
      const user = await this.userRepository.findOneOrFail({
        where: { id: userId },
        relations: ['role', 'userDetail', 'translator'],
      });

      result = {
        ...user,
      };

      if (user.role.name === 'translator') {
        const {
          user: translatorUser,
          reviews,
          ...rest
        } = await this.translatorService.findById(user.translator.id);

        result = {
          ...result,
          translator: rest,
        };
      }

      return result;
    } catch (error) {
      throw error;
    }
  }
}

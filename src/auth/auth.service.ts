import { TranslatorStatus } from '#/translator/entities/translator.entity';
import { CreateUserDto } from '#/users/dto/create-user.dto';
import { User } from '#/users/entities/user.entity';
import { TranslatorDocumentsType, UsersService } from '#/users/users.service';
import {
  BadRequestException,
  ForbiddenException,
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
    private readonly userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(
    createUserDto: CreateUserDto,
    documents: TranslatorDocumentsType,
  ) {
    try {
      const user = await this.userService.create(createUserDto, documents);

      return user;
    } catch (error) {
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.userRepository.findOneOrFail({
        where: { email: loginDto.email },
        relations: ['translator', 'role'],
        select: ['id', 'email', 'password', 'role', 'translator'],
      });

      if (user.role.name === 'translator') {
        if (user.translator.status === TranslatorStatus.PENDING) {
          throw new ForbiddenException(
            'Your registration is pending approval by the admin. You will be notified once your registration is approved.',
          );
        }

        if (user.translator.status === TranslatorStatus.REJECTED) {
          throw new ForbiddenException(
            'Your registration has been rejected. Please check your email for more information.',
          );
        }
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Incorrect password provided');
      }

      const payload = {
        id: user.id,
        email: user.email,
        role: user.role.name,
      };

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
      });
      const isPasswordValid = await bcrypt.compare(
        changePasswordDto.oldPassword,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Incorrect password provided');
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
}

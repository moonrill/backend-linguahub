import { TranslatorStatus } from '#/translator/entities/translator.entity';
import { CreateUserDto } from '#/users/dto/create-user.dto';
import { TranslatorDocumentsType, UsersService } from '#/users/users.service';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
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
      const user = await this.userService.findByEmail(loginDto.email);

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
}

import { CreateUserDto } from '#/users/dto/create-user.dto';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Put,
  Request,
  UploadedFiles,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './strategies/public.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @UploadedFiles()
    documents: {
      cv?: Express.Multer.File[];
      certificate?: Express.Multer.File[];
    },
    @Body() createUserDto: CreateUserDto,
  ) {
    return {
      data: await this.authService.register(createUserDto),
      statusCode: HttpStatus.CREATED,
      message: 'Register success',
    };
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return {
      data: await this.authService.login(loginDto),
      statusCode: HttpStatus.OK,
      message: 'Login success',
    };
  }

  @Get('profile')
  async profile(@Request() req) {
    return {
      data: req.user,
      statusCode: HttpStatus.OK,
      message: 'Success get profile',
    };
  }

  @Put('change-password')
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return {
      data: await this.authService.changePassword(
        req.user.id,
        changePasswordDto,
      ),
      statusCode: HttpStatus.OK,
      message: 'Success change password',
    };
  }
}

import { GoogleCalendarService } from '#/google-calendar/google-calendar.service';
import { CreateUserDto } from '#/users/dto/create-user.dto';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Put,
  Query,
  Request,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './strategies/public.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
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
      data: await this.authService.getProfile(req.user.id),
      statusCode: HttpStatus.OK,
      message: 'Success get profile',
    };
  }

  @Public()
  @Get('google')
  async google(@Query('email') email: string, @Res() res) {
    const decoded = decodeURIComponent(email);
    const url = await this.googleCalendarService.getAuthUrl(decoded);

    res.redirect(url);
  }

  @Public()
  @Get('google/redirect')
  async googleRedirect(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res,
  ) {
    try {
      const loggedInUserEmail = JSON.parse(decodeURIComponent(state)).email;

      await this.googleCalendarService.saveUserToken(code, loggedInUserEmail);

      res.redirect(`${this.configService.get<string>('FRONTEND_URL')}/login`);
    } catch (error) {
      res.redirect(
        `${this.configService.get<string>(
          'FRONTEND_URL',
        )}/error?message=${encodeURIComponent(error.message)}`,
      );
      throw error;
    }
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

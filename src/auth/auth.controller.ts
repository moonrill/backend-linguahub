import { CreateUserDto } from '#/users/dto/create-user.dto';
import { translatorDocumentStorage } from '#/utils/upload-documents';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Request,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './strategies/public.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cv', maxCount: 1 },
        { name: 'certificate', maxCount: 1 },
      ],
      translatorDocumentStorage,
    ),
  )
  async register(
    @UploadedFiles()
    documents: {
      cv?: Express.Multer.File[];
      certificate?: Express.Multer.File[];
    },
    @Body() createUserDto: CreateUserDto,
  ) {
    if (createUserDto.role === 'translator') {
      if (!documents.cv || !documents.certificate) {
        throw new BadRequestException('Please upload your cv and certificate');
      }
    }

    return {
      data: await this.authService.register(createUserDto, documents),
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
}

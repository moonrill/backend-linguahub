import { CreateUserDto } from '#/users/dto/create-user.dto';
import { TranslatorDocumentsType, UsersService } from '#/users/users.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UsersService) {}

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
}

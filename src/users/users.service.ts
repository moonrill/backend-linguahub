import { RoleService } from '#/role/role.service';
import { TranslatorService } from '#/translator/translator.service';
import { PaginationDto } from '#/utils/pagination.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { EntityNotFoundError, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDetail } from './entities/user-detail.entity';
import { User } from './entities/user.entity';

export type TranslatorDocumentsType = {
  cv?: Express.Multer.File[];
  certificate?: Express.Multer.File[];
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserDetail)
    private userDetailRepository: Repository<UserDetail>,
    private roleService: RoleService,
    private translatorService: TranslatorService,
  ) {}

  async create(createUserDto: CreateUserDto, files: TranslatorDocumentsType) {
    try {
      // Check if email already exist
      const isUserExist = await this.usersRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (isUserExist) {
        throw new BadRequestException(
          'This email is already in use. Please try a different one.',
        );
      }

      // Just allow role to be client or translator
      const allowedRoles = ['client', 'translator'];
      if (!allowedRoles.includes(createUserDto.role)) {
        throw new BadRequestException('Invalid role');
      }

      // Check if role exist
      const role = await this.roleService.findByName(createUserDto.role);

      // Create user detail
      const newUserDetail = new UserDetail();
      newUserDetail.fullName = createUserDto.fullName;
      newUserDetail.gender = createUserDto.gender;
      newUserDetail.dateOfBirth = createUserDto.dateOfBirth;
      newUserDetail.phoneNumber = createUserDto.phoneNumber;
      newUserDetail.province = createUserDto.province;
      newUserDetail.city = createUserDto.city;
      newUserDetail.district = createUserDto.district;
      newUserDetail.subDistrict = createUserDto.subDistrict;
      newUserDetail.street = createUserDto.street;

      const insertUserDetail = await this.userDetailRepository.insert(
        newUserDetail,
      );

      // Generate salt
      const salt = await bcrypt.genSalt();
      const hashPassword = await bcrypt.hash(createUserDto.password, salt);

      const newUser = new User();
      newUser.email = createUserDto.email;
      newUser.userDetail = insertUserDetail.identifiers[0].id;
      newUser.role = role;
      newUser.salt = salt;
      newUser.password = hashPassword;

      const insertUser = await this.usersRepository.insert(newUser);

      // TODO: add language and specialization for translator
      // Check if role is translator
      if (createUserDto.role === 'translator') {
        const translatorData = {
          yearsOfExperience: createUserDto.yearsOfExperience,
          portfolioLink: createUserDto.portfolioLink,
          bank: createUserDto.bank,
          bankAccountNumber: createUserDto.bankAccountNumber,
          userId: insertUser.identifiers[0].id,
          cv: files.cv[0].filename,
          certificate: files.certificate[0].filename,
        };

        await this.translatorService.create(translatorData);
      }

      return await this.usersRepository.findOneOrFail({
        where: {
          id: insertUser.identifiers[0].id,
        },
        relations: {
          userDetail: true,
          role: true,
          translator: true,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;
    const [data, total] = await this.usersRepository.findAndCount({
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      totalPages,
      limit,
    };
  }

  async findOne(id: string) {
    try {
      const user = await this.usersRepository.findOneOrFail({
        where: {
          id,
        },
        relations: {
          userDetail: true,
          role: true,
        },
      });

      if (user.role.name === 'translator') {
        const translator = await this.translatorService.findByUserId(id);
        user.translator = translator;
      }

      return user;
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new NotFoundException('User not found');
      } else {
        throw e;
      }
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.findOne(id);

      const existEmail = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existEmail && existEmail.id !== id) {
        throw new BadRequestException(
          'This email is already in use. Please try a different one.',
        );
      }

      const newUser = new User();
      newUser.email = updateUserDto.email;
      await this.usersRepository.update(id, newUser);

      const newUserDetail = new UserDetail();
      newUserDetail.fullName = updateUserDto.fullName;
      newUserDetail.gender = updateUserDto.gender;
      newUserDetail.dateOfBirth = updateUserDto.dateOfBirth;
      newUserDetail.phoneNumber = updateUserDto.phoneNumber;
      newUserDetail.province = updateUserDto.province;
      newUserDetail.city = updateUserDto.city;
      newUserDetail.district = updateUserDto.district;
      newUserDetail.subDistrict = updateUserDto.subDistrict;
      newUserDetail.street = updateUserDto.street;

      await this.userDetailRepository.update(user.userDetail.id, newUserDetail);

      return await this.findOne(id);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id);
      await this.usersRepository.softDelete(id);
    } catch (error) {
      throw error;
    }
  }
}

import { Role } from '#/role/entities/role.entity';
import { RoleService } from '#/role/role.service';
import { TranslatorService } from '#/translator/translator.service';
import { PaginationDto } from '#/utils/pagination.dto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import {
  DataSource,
  EntityManager,
  EntityNotFoundError,
  Repository,
} from 'typeorm';
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
    private dataSource: DataSource,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    documents: TranslatorDocumentsType,
  ) {
    try {
      return this.dataSource.transaction(async (transactionEntityManager) => {
        await this.checkIfUserExists(createUserDto.email);

        this.validateRole(createUserDto.role);

        const role = await this.roleService.findByName(createUserDto.role);
        const userDetail = await this.createUserDetail(
          createUserDto,
          transactionEntityManager,
        );
        const user = await this.createUser(
          createUserDto,
          role,
          userDetail,
          transactionEntityManager,
        );

        if (createUserDto.role === 'translator') {
          const translatorData = {
            yearsOfExperience: createUserDto.yearsOfExperience,
            portfolioLink: createUserDto.portfolioLink,
            bank: createUserDto.bank,
            bankAccountNumber: createUserDto.bankAccountNumber,
            userId: user.id,
            cv: documents.cv[0].filename,
            certificate: documents.certificate[0].filename,
            languages: createUserDto.languages,
            specializations: createUserDto.specializations,
          };
          await this.translatorService.create(
            translatorData,
            transactionEntityManager,
          );
        }

        return transactionEntityManager.findOneOrFail(User, {
          where: { id: user.id },
          relations: {
            userDetail: true,
            role: true,
            translator: true,
          },
        });
      });
    } catch (error) {
      throw error;
    }
  }

  private async checkIfUserExists(email: string): Promise<void> {
    const isUserExist = await this.usersRepository.findOne({
      where: { email },
    });
    if (isUserExist) {
      throw new ConflictException(
        'This email is already in use. Please try a different one.',
      );
    }
  }

  private validateRole(role: string): void {
    const allowedRoles = ['client', 'translator'];
    if (!allowedRoles.includes(role)) {
      throw new BadRequestException('Invalid role');
    }
  }

  private async createUserDetail(
    createUserDto: CreateUserDto,
    transactionalEntityManager: EntityManager,
  ): Promise<UserDetail> {
    const newUserDetail = new UserDetail();
    Object.assign(newUserDetail, {
      fullName: createUserDto.fullName,
      gender: createUserDto.gender,
      dateOfBirth: createUserDto.dateOfBirth,
      phoneNumber: createUserDto.phoneNumber,
      province: createUserDto.province,
      city: createUserDto.city,
      district: createUserDto.district,
      subDistrict: createUserDto.subDistrict,
      street: createUserDto.street,
    });

    return transactionalEntityManager.save(UserDetail, newUserDetail);
  }

  private async createUser(
    createUserDto: CreateUserDto,
    role: Role,
    userDetail: UserDetail,
    transactionalEntityManager: EntityManager,
  ): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(createUserDto.password, salt);

    const newUser = new User();
    Object.assign(newUser, {
      email: createUserDto.email,
      userDetail: userDetail,
      role: role,
      salt: salt,
      password: hashPassword,
    });

    return transactionalEntityManager.save(User, newUser);
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

  async findById(id: string) {
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

  async findByEmail(email: string) {
    try {
      const user = await this.usersRepository.findOneOrFail({
        where: {
          email,
        },
        relations: {
          role: true,
          translator: true,
        },
      });

      return user;
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new NotFoundException(
          "We're sorry, no account was found with that email address.",
        );
      } else {
        throw e;
      }
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.findById(id);

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

      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.findById(id);
      await this.usersRepository.softDelete(id);
    } catch (error) {
      throw error;
    }
  }
}

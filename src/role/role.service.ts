import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { EntityNotFoundError, Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role';
import { PaginationDto } from '#/utils/pagination.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    try {
      const newRole = new Role();
      newRole.name = createRoleDto.name;

      const insertResult = await this.roleRepository.insert(newRole);
      return await this.roleRepository.findOneOrFail({
        where: {
          id: insertResult.identifiers[0].id,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { page, limit } = paginationDto;
      const skip = (page - 1) * limit;
      const [data, total] = await this.roleRepository.findAndCount({
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
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      return await this.roleRepository.findOneOrFail({
        where: {
          id,
        },
      });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Role not found',
            error: 'Not Found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
    }
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    try {
      const existingRole = await this.findOne(id);

      const updatedRole = new Role();
      updatedRole.name = updateRoleDto.name;

      await this.roleRepository.update(existingRole.id, updatedRole);

      return await this.roleRepository.findOneOrFail({
        where: { id },
      });
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id);

      await this.roleRepository.softDelete(id);

      return {
        statusCode: HttpStatus.OK,
        message: 'Success delete role',
      };
    } catch (error) {
      throw error;
    }
  }
}

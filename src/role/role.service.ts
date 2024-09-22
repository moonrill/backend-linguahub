import { PaginationDto } from '#/utils/pagination.dto';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role';
import { Role } from './entities/role.entity';

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
      const [data, total] = await this.roleRepository.findAndCount({
        skip: (page - 1) * limit,
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

  async findByName(name: string) {
    try {
      return await this.roleRepository.findOneOrFail({
        where: {
          name,
        },
      });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Role not found');
      }
    }
  }

  async update(name: string, updateRoleDto: UpdateRoleDto) {
    try {
      const existingRole = await this.findByName(name);

      const updatedRole = new Role();
      updatedRole.name = updateRoleDto.name;

      await this.roleRepository.update(existingRole.id, updatedRole);

      return await this.roleRepository.findOneOrFail({
        where: { id: existingRole.id },
      });
    } catch (error) {
      throw error;
    }
  }

  async remove(name: string) {
    try {
      const role = await this.findByName(name);

      await this.roleRepository.softDelete(role.id);

      return {
        statusCode: HttpStatus.OK,
        message: 'Success delete role',
      };
    } catch (error) {
      throw error;
    }
  }
}

import { PaginationDto } from '#/utils/pagination.dto';
import { Controller, Get, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoleService } from './role.service';

@ApiTags('Role')
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.roleService.findAll(paginationDto);

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get all roles',
    };
  }

  @Get(':name')
  async findOne(@Param('name') name: string) {
    return {
      data: await this.roleService.findByName(name),
      statusCode: HttpStatus.OK,
      message: 'Success get role by name',
    };
  }
}

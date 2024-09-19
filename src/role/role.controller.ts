import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpStatus,
  Put,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role';
import { PaginationDto } from '#/utils/pagination.dto';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    return {
      data: await this.roleService.create(createRoleDto),
      statusCode: HttpStatus.CREATED,
      message: 'Success create role',
    };
  }

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

  @Put(':name')
  async update(
    @Param('name') name: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return {
      data: await this.roleService.update(name, updateRoleDto),
      statusCode: HttpStatus.OK,
      message: 'Success update role',
    };
  }

  @Delete(':name')
  async remove(@Param('name') name: string) {
    return this.roleService.remove(name);
  }
}

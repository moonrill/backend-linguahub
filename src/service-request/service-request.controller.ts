import { Role } from '#/auth/role.enum';
import { Roles } from '#/auth/roles.decorator';
import { PaginationDto } from '#/utils/pagination.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { QueryServiceRequestDto } from './dto/query.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import { ServiceRequestService } from './service-request.service';

@Controller('service-requests')
export class ServiceRequestController {
  constructor(private readonly serviceRequestService: ServiceRequestService) {}

  @Roles(Role.CLIENT)
  @Post()
  async create(
    @Request() req,
    @Body() createServiceRequestDto: CreateServiceRequestDto,
  ) {
    return {
      data: await this.serviceRequestService.create(
        req.user.id,
        createServiceRequestDto,
      ),
      statusCode: HttpStatus.CREATED,
      message: 'Success create service request',
    };
  }

  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() queryDto: QueryServiceRequestDto,
  ) {
    const result = await this.serviceRequestService.findAll(
      paginationDto,
      queryDto,
    );

    return {
      ...result,
      statusCode: HttpStatus.OK,
      message: 'Success get all service requests',
    };
  }

  @Get(':id')
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return {
      data: await this.serviceRequestService.findById(id),
      statusCode: HttpStatus.OK,
      message: 'Success get service request by id',
    };
  }

  // TODO: implement update
  @Roles(Role.CLIENT)
  @Put(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req,
    updateServiceRequestDto: UpdateServiceRequestDto,
  ) {}

  @Roles(Role.CLIENT)
  @Delete(':id')
  async cancel(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return await this.serviceRequestService.cancelRequest(id, req.user.id);
  }
}

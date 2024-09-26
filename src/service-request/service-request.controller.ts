import { Role } from '#/auth/role.enum';
import { Roles } from '#/auth/roles.decorator';
import { Body, Controller, HttpStatus, Post, Request } from '@nestjs/common';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
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
}

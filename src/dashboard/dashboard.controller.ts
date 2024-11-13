import { Role } from '#/auth/role.enum';
import { Roles } from '#/auth/roles.decorator';
import { Controller, Get, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles(Role.ADMIN)
  @Get('/admin')
  async getAdminDashboardData() {
    return await this.dashboardService.getAdminDashboardData();
  }

  @Roles(Role.TRANSLATOR)
  @Get('/translator')
  async getTranslatorDashboardData(@Request() req) {
    return await this.dashboardService.getTranslatorDashboardData(
      req.user.translatorId,
    );
  }
}

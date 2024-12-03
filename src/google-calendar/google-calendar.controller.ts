import { Controller, Get, HttpStatus, Request } from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';

@Controller('google-calendar')
export class GoogleCalendarController {
  constructor(private readonly googleCalendarService: GoogleCalendarService) {}

  @Get('/events')
  async getEvents(@Request() req) {
    return {
      data: await this.googleCalendarService.getCalendarEvents(req.user.id),
      statusCode: HttpStatus.OK,
      message: 'Success get calendar events',
    };
  }
}

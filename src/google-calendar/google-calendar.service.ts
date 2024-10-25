import { Booking } from '#/booking/entities/booking.entity';
import { User } from '#/users/entities/user.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { Repository } from 'typeorm';

@Injectable()
export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      configService.get<string>('GOOGLE_CLIENT_ID'),
      configService.get<string>('GOOGLE_CLIENT_SECRET'),
      configService.get<string>('GOOGLE_REDIRECT_URL'),
    );
  }

  async getAuthUrl(email: string): Promise<string> {
    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'select_account',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      state: encodeURIComponent(JSON.stringify({ email })),
    });

    return url;
  }

  async saveUserToken(code: string, loggedInEmail: string) {
    const { tokens } = await this.oauth2Client.getToken(code);

    this.oauth2Client.setCredentials(tokens);

    // Get User Info
    const peopleService = google.people({
      version: 'v1',
      auth: this.oauth2Client,
    });

    const response = await peopleService.people.get({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses',
    });

    const googleEmail = response.data.emailAddresses[0].value;

    // Validasi email
    if (googleEmail !== loggedInEmail) {
      throw new Error(
        'Google email does not match the account that is currently logged in',
      );
    }

    const user = await this.userRepository.findOne({
      where: { email: googleEmail },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.update(user.id, {
      googleCalendarToken: tokens.refresh_token,
    });
  }

  async addBookingToCalendar(
    type: 'client' | 'translator',
    booking: Booking,
  ): Promise<void> {
    let attendees = [];
    let description = '';
    let token = '';

    // Prepare details for the calendar event
    switch (type) {
      case 'client':
        attendees = [{ email: booking.translator.user.email }];
        description = `
      You have a scheduled translation service booking. 
      Details are as follows:

      - Translator: ${booking.translator.user.userDetail.fullName}
      - Service Language: ${booking.service.sourceLanguage.name} - ${
          booking.service.targetLanguage.name
        }
      - Location: ${booking.location}
      - Date: ${booking.bookingDate}
      - Start Time: ${booking.startAt.slice(0, 5)}
      - End Time: ${booking.endAt.slice(0, 5)}

      If you have any questions or need to reschedule, please feel free to contact us. 
      We look forward to assisting you!
      `;
        break;

      case 'translator':
        attendees = [{ email: booking.user.email }];
        description = `
      You have a scheduled translation service booking. 
      Details are as follows:

      - Client: ${booking.user.userDetail.fullName}
      - Service Language: ${booking.service.sourceLanguage.name} - ${
          booking.service.targetLanguage.name
        }
      - Location: ${booking.location}
      - Date: ${booking.bookingDate}
      - Start Time: ${booking.startAt.slice(0, 5)}
      - End Time: ${booking.endAt.slice(0, 5)}

      If you have any questions or need to reschedule, please feel free to contact us. 
      We look forward to assisting you!
      `;
        break;

      default:
        throw new Error('Invalid type');
    }

    // Determine which access token to use based on type
    if (type === 'client') {
      token = booking.user.googleCalendarToken;
    } else {
      token = booking.translator.user.googleCalendarToken;
    }

    if (!token) {
      throw new Error('Google Calendar token not found');
    }

    this.oauth2Client.setCredentials({
      refresh_token: token,
    });

    const calendar = google.calendar({
      version: 'v3',
      auth: this.oauth2Client,
    });

    const event = {
      summary: `Booking for Translation Service: ${booking.service.name}`,
      description,
      location: booking.location,
      start: {
        dateTime: `${booking.bookingDate}T${booking.startAt}`,
        timeZone: 'Asia/Jakarta',
      },
      end: {
        dateTime: `${booking.bookingDate}T${booking.endAt}`,
        timeZone: 'Asia/Jakarta',
      },
      attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 24 * 60 },
        ],
      },
    };

    try {
      await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        auth: this.oauth2Client,
        sendNotifications: true,
      });
    } catch (error) {
      if (error.code === 401) {
        try {
          const newTokens = await this.oauth2Client.refreshAccessToken();

          this.oauth2Client.setCredentials(newTokens.credentials);

          const id =
            type === 'client' ? booking.user.id : booking.translator.id;

          await this.userRepository.update(id, {
            googleCalendarToken: newTokens.credentials.access_token,
          });

          // Retry the calendar event insertion
          await calendar.events.insert({
            calendarId: 'primary',
            auth: this.oauth2Client,
            requestBody: event,
          });
        } catch (refreshError) {
          throw new Error('Failed to refresh token and insert calendar event');
        }
      } else {
        throw error;
      }
    }
  }
}

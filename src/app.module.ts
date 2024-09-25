import { SeederModule } from '#/seeder/seeder.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { LoggerModule } from 'nestjs-pino';
import { join } from 'path';
import * as pino from 'pino';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { CouponModule } from './coupon/coupon.module';
import { EventModule } from './event/event.module';
import { HealthModule } from './health/health.module';
import { LanguageModule } from './language/language.module';
import { RoleModule } from './role/role.module';
import { SpecializationModule } from './specialization/specialization.module';
import { TranslatorModule } from './translator/translator.module';
import { UsersModule } from './users/users.module';
import { ServiceModule } from './service/service.module';
import { ReviewModule } from './review/review.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        base: undefined,
        genReqId: (req) => {
          return req['x-correlation-id'];
        },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers["user-agent"]',
            'req.headers.accept',
            'req.headers["accept-encoding"]',
            'req.headers["accept-language"]',
            'req.headers.host',
            'req.headers.connection',
            'req.headers.cookie',
            'req.headers["sec-ch-ua"]',
            'req.headers["sec-ch-ua-mobile"]',
            'req.headers["sec-ch-ua-platform"]',
            'req.headers["upgrade-insecure-requests"]',
            'req.headers["sec-fetch-site"]',
            'req.headers["sec-fetch-mode"]',
            'req.headers["sec-fetch-user"]',
            'req.headers["sec-fetch-dest"]',
            'req.headers["if-none-match"]',
            'req.headers["cache-control"]',
            'req.query',
            'req.params',
            'req.remoteAddress',
            'req.remotePort',
            'res.headers["access-control-allow-origin"]',
            'res.headers["content-type"]',
            'res.headers["content-length"]',
            'res.headers["etag"]',
          ],
          remove: true,
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        // install 'pino-pretty' package in order to use the following option
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
    ConfigModule.forRoot({
      load: [configuration],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_CLIENT: Joi.valid('mysql', 'postgres'),
        DATABASE_HOST: Joi.string(),
        DATABASE_NAME: Joi.string(),
        DATABASE_USERNAME: Joi.string(),
        DATABASE_PASSWORD: Joi.string().empty('').default(''),
        DATABASE_PORT: Joi.number().default(5432),
      }),
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          type: configService.get<'postgres' | 'mysql'>('database.client'),
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.name'),
          entities: [],
          synchronize: configService.get<string>('env') === 'development',
          autoLoadEntities: true,
          logging: false,
          namingStrategy: new SnakeNamingStrategy(),
        };
      },
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads/images'),
      serveRoot: '/images',
    }),
    SeederModule,
    UsersModule,
    HealthModule,
    LanguageModule,
    RoleModule,
    TranslatorModule,
    EventModule,
    CouponModule,
    SpecializationModule,
    AuthModule,
    ServiceModule,
    ReviewModule,
  ],
})
export class AppModule {}

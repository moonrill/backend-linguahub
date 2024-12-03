import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { CorrelationIdMiddleware } from './utils/correlation-id.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const logger = app.get(Logger);

  app.disable('x-powered-by');
  app.use(CorrelationIdMiddleware());
  app.useLogger(logger);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('API Docs')
    .setDescription('API description')
    .setVersion('1.0')
    .addTag('apidocs')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  const configService = app.get<ConfigService>(ConfigService);
  const port = configService.get<number>('port');

  // TODO: Replace this
  const hostname = '0.0.0.0';

  await app.listen(port, hostname, () => {
    // logger.log(`Server listening on ${hostname}:${port}`);
    // if (error) {
    //   logger.error(error);
    //   process.exit(1);
    // } else {
    //   logger.log(`Server listening on ${address}`);
    // }
  });
}

bootstrap();

import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import session from 'express-session';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: true,
    credentials: true,
  })

  app.use(
    session({
      name: 'connect.sid',
      secret: String(process.env.SESSION_SECRET),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

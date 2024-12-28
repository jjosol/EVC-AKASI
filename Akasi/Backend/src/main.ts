import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3000',  // Allow all origins (you can restrict to specific origins)
    methods: 'GET,POST,PUT,DELETE,PATCH', // Specify allowed methods
    allowedHeaders: 'Content-Type, Authorization', // Specify allowed headers
  });


  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

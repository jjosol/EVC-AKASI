import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3000',  // Allow requests from your Nuxt frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Specify allowed HTTP methods
    credentials: true, // Allow sending cookies from the frontend
  });
  // app.enableCors({
  //   origin: ['http://localhost:3000', 'http://10.35.115.250:3000'], // Allow both local and network IP
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   allowedHeaders: 'Content-Type, Authorization',
  //   credentials: true, // Needed if you're sending cookies or authentication headers
  // });
  
    await app.listen(process.env.PORT || 3001);
  // await app.listen(process.env.PORT || 3001, '0.0.0.0');
}
bootstrap();  
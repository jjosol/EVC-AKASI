import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set timeout options to the underlying HTTP server
  const server = app.getHttpServer();
  server.setTimeout(60000); // 60 seconds timeout
  
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    // Add proper headers for connection handling
    exposedHeaders: ['Content-Length', 'Content-Type'],
  });
  
  // Configure global request timeout
  app.use((req, res, next) => {
    res.setTimeout(30000, () => {
      console.log('Request has timed out.');
      res.status(408).send('Request Timeout');
    });
    next();
  });

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
 // app.enableCors({
  //   origin: ['http://localhost:3000', 'http://10.35.115.250:3000'], // Allow both local and network IP
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   allowedHeaders: 'Content-Type, Authorization',
  //   credentials: true, // Needed if you're sending cookies or authentication headers
  // });
  
  // await app.listen(process.env.PORT || 3001);
  // await app.listen(process.env.PORT || 3001, '0.0.0.0');
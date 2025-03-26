// auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, Headers, HttpException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: { username: string; password: string }) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Headers('authorization') token: string) {
    return this.authService.logout(token?.split(' ')[1]);
  }

  @Post('hash-passwords')
  async hashAllPasswords() {
    try {
      return await this.authService.hashAllPasswords();
    } catch (error) {
      throw new HttpException(
        'Error hashing passwords: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
// auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
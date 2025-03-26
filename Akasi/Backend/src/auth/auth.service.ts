//auth.services.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) { }

  async login(loginDto: { username: string; password: string }) {
    const { username, password } = loginDto;

    // Find user (admin or client)
    const admin = await this.prisma.admin.findFirst({ where: { username } });
    const client = await this.prisma.client.findFirst({ where: { username } });

    const user = admin || client;

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // In AuthService, change your payload creation:
    const payload = admin
      ? {
        sub: admin.admin_id,
        username: admin.username,
        role: 'admin'
      }
      : {
        sub: client.client_id, // Use 'sub' for client_id as per JWT standards
        username: client.username,
        role: 'client'
      };

    const token = this.jwtService.sign(payload);

    return {
      isAuthenticated: true,
      token,
      role: payload.role
    };
  }

  async logout(token: string) {
    // You could implement token blacklisting here if needed
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}

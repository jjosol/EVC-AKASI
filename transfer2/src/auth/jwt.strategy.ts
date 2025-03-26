// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    this.logger.log('[JWT] Payload received:', payload);

    // Define a variable to hold the user data
    let userData: any = null;

    // Check if the token has client information
    if (payload.sub && payload.role === 'client') {
      try {
        const client = await this.prisma.client.findUnique({
          where: {
            client_id: payload.sub,
          },
        });

        if (client) {
          userData = {
            id: client.client_id,        // For controllers expecting id
            client_id: client.client_id, // For controllers expecting client_id
            username: client.username,
            grade: client.grade,
            role: 'client',
          };
          this.logger.debug(`[JWT] Found client: ${client.client_id}`);
        }
      } catch (err) {
        this.logger.error('[JWT] Error looking up client:', err);
      }
    } else if (payload.sub && payload.role === 'admin') {
      try {
        const admin = await this.prisma.admin.findUnique({
          where: {
            admin_id: payload.sub,
          },
        });

        if (admin) {
          userData = {
            id: admin.admin_id,       // Consistent naming
            admin_id: admin.admin_id,
            username: admin.username,
            role: 'admin',
          };
          this.logger.debug(`[JWT] Found admin: ${admin.admin_id}`);
        }
      } catch (err) {
        this.logger.error('[JWT] Error looking up admin:', err);
      }
    }

    if (!userData) {
      this.logger.error('[JWT] No valid user found for token payload:', payload);
      throw new UnauthorizedException('Invalid token');
    }

    // Additional logging to help debug client file access issues
    this.logger.log(`[JWT] User authenticated - ID: ${userData.id}, Role: ${userData.role}`);

    return userData;
  }
}
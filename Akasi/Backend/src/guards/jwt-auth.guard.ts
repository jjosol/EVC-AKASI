// src/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Add additional pre-authentication checks here if needed
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Enhanced error handling for better security logging
    if (err || !user) {
      const request = context.switchToHttp().getRequest();
      const ip = request.ip || 'unknown IP';
      const path = request.path || 'unknown path';
      const method = request.method || 'unknown method';

      this.logger.error(`Authentication failed for ${method} ${path} from ${ip}`);
      if (info) {
        this.logger.error('JWT validation error details:', info);
      }

      throw err || new UnauthorizedException('You must be logged in to access this resource');
    }

    // Log successful authentication for audit purposes
    const request = context.switchToHttp().getRequest();

    // For client users: ensure we have both id and client_id
    if (user.client_id && !user.id) {
      user.id = user.client_id;
      this.logger.debug(`Added id field (${user.id}) for consistency`);
    } else if (user.id && !user.client_id && user.role === 'client') {
      user.client_id = user.id;
      this.logger.debug(`Added client_id field (${user.client_id}) for consistency`);
    }

    // For admin users: ensure we have both id and admin_id
    if (user.admin_id && !user.id) {
      user.id = user.admin_id;
      this.logger.debug(`Added id field (${user.id}) for admin consistency`);
    } else if (user.id && !user.admin_id && user.role === 'admin') {
      user.admin_id = user.id;
      this.logger.debug(`Added admin_id field (${user.admin_id}) for admin consistency`);
    }

    this.logger.log(`Authenticated user: ${user.id}, role: ${user.role}, path: ${request.path}`);

    return user;
  }
}
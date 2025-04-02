// src/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private reflector = new Reflector();

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }
    
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

    // For manager users: ensure we have both id and manager_id
    if (user.manager_id && !user.id) {
      user.id = user.manager_id;
      this.logger.debug(`Added id field (${user.id}) for manager consistency`);
    } else if (user.id && !user.manager_id && user.role === 'manager') {
      user.manager_id = user.id;
      this.logger.debug(`Added manager_id field (${user.manager_id}) for manager consistency`);
    }

    this.logger.log(`Authenticated user: ${user.id}, role: ${user.role}, path: ${request.path}`);

    return user;
  }
}
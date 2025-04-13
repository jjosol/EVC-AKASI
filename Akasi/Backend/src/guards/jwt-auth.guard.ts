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

    // For patient users: ensure we have both id and patient_id
    if (user.patient_id && !user.id) {
      user.id = user.patient_id;
      this.logger.debug(`Added id field (${user.id}) for consistency`);
    } else if (user.id && !user.patient_id && user.role === 'patient') {
      user.patient_id = user.id;
      this.logger.debug(`Added patient_id field (${user.patient_id}) for consistency`);
    }

    // For nurse users: ensure we have both id and nurse_id
    if (user.nurse_id && !user.id) {
      user.id = user.nurse_id;
      this.logger.debug(`Added id field (${user.id}) for nurse consistency`);
    } else if (user.id && !user.nurse_id && user.role === 'nurse') {
      user.nurse_id = user.id;
      this.logger.debug(`Added nurse_id field (${user.nurse_id}) for nurse consistency`);
    }

    // For doctor users: ensure we have both id and doctor_id
    if (user.doctor_id && !user.id) {
      user.id = user.doctor_id;
      this.logger.debug(`Added id field (${user.id}) for doctor consistency`);
    } else if (user.id && !user.doctor_id && user.role === 'doctor') {
      user.doctor_id = user.id;
      this.logger.debug(`Added doctor_id field (${user.doctor_id}) for doctor consistency`);
    }

    this.logger.log(`Authenticated user: ${user.id}, role: ${user.role}, path: ${request.path}`);

    return user;
  }
}
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  getProfile(@Request() req) {
    console.log('User data in request:', req.user);

    if (req.user.role === 'client') {
      // Use client_id instead of id
      return this.profileService.getProfile(req.user.client_id, req.user.role);
    } else if (req.user.role === 'admin') {
      // Use admin_id instead of id
      return this.profileService.getProfile(req.user.admin_id, req.user.role);
    }

    return null;
  }
}
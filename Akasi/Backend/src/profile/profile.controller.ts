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

    if (req.user.role === 'patient') {
      return this.profileService.getProfile(req.user.patient_id, req.user.role);
    } else if (req.user.role === 'nurse') {
      return this.profileService.getProfile(req.user.nurse_id, req.user.role);
    } else if (req.user.role === 'doctor') {
      return this.profileService.getProfile(req.user.doctor_id, req.user.role);
    }

    return null;
  }
}
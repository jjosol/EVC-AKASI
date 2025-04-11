import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ChangePasswordService } from './changePass.service';
import { AuthGuard } from '@nestjs/passport';

const JwtAuthGuard = AuthGuard('jwt');

@Controller('change-password')
@UseGuards(JwtAuthGuard)
export class ChangePasswordController {
  constructor(private readonly changePasswordService: ChangePasswordService) {}

  @Post('/doctor/:id')
  async changeDoctorPassword(
    @Param('id') id: string,
    @Body() changePasswordDto: { currentPassword: string; newPassword: string }
  ) {
    return this.changePasswordService.changePasswordForDoctor(
      Number(id),
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );
  }

  @Post('/nurse/:id')
  async changeNursePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: { currentPassword: string; newPassword: string }
  ) {
    return this.changePasswordService.changePasswordForNurse(
      Number(id),
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );
  }

  @Post('/patient/:id')
  async changePatientPassword(
    @Param('id') id: string,
    @Body() changePasswordDto: { currentPassword: string; newPassword: string }
  ) {
    return this.changePasswordService.changePasswordForPatient(
      Number(id),
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );
  }
}
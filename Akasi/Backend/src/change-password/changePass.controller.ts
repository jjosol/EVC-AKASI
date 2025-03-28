import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ChangePasswordService } from './changePass.service';
import { AuthGuard } from '@nestjs/passport';

const JwtAuthGuard = AuthGuard('jwt');

@Controller('change-password') // Remove 'api' prefix - NestJS handles this
@UseGuards(JwtAuthGuard)
export class ChangePasswordController {
  constructor(private readonly changePasswordService: ChangePasswordService) {}

  @Post('/admin/:id')
  async changeAdminPassword(
    @Param('id') id: string,
    @Body() changePasswordDto: { currentPassword: string; newPassword: string }
  ) {
    return this.changePasswordService.changePasswordForAdmin(
      Number(id),
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );
  }

  @Post('/client/:id')
  async changeClientPassword(
    @Param('id') id: string,
    @Body() changePasswordDto: { currentPassword: string; newPassword: string }
  ) {
    return this.changePasswordService.changePasswordForClient(
      Number(id),
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );
  }
}
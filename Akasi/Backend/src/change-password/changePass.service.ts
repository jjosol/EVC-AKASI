import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChangePasswordService {
  constructor(private prisma: PrismaService) {}

  async changePasswordForAdmin(adminId: number, currentPassword: string, newPassword: string) {
    // Find the admin
    const admin = await this.prisma.admin.findFirst({
      where: { admin_id: adminId }
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update admin password
    await this.prisma.admin.update({
      where: { admin_id: adminId },
      data: { password: hashedPassword }
    });

    return { message: 'Password updated successfully' };
  }

  async changePasswordForClient(clientId: number, currentPassword: string, newPassword: string) {
    // Find the client
    const client = await this.prisma.client.findFirst({
      where: { client_id: clientId }
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, client.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update client password
    await this.prisma.client.update({
      where: { client_id: clientId },
      data: { password: hashedPassword }
    });

    return { message: 'Password updated successfully' };
  }
}
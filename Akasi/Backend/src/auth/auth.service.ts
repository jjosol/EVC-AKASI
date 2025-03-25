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
  ) {}

  async login(loginDto: { username: string; password: string }) {
    const { username, password } = loginDto;

    // Find user (superuser, admin or client)
    const manager = await this.prisma.manager.findFirst({ where: { username } });
    const admin = await this.prisma.admin.findFirst({ where: { username } });
    const client = await this.prisma.client.findFirst({ where: { username } });

    const user = manager || admin || client;

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Determine user role and ID based on which model the user was found in
    let role, id;
    if (manager) {
      role = 'manager'
      id = manager.manager_id;
    } else if (admin) {
      role = 'admin';
      id = admin.admin_id;
    } else {
      role = 'client';
      id = client.client_id;
    }

    const payload = { id, role };
    const token = this.jwtService.sign(payload);

    return { 
      isAuthenticated: true, 
      token,
      role
    };
  }

  async logout(token: string) {
    // You could implement token blacklisting here if needed
    return {
      success: true,
      message: 'Logged out successfully'
    };
  }

  async hashAllPasswords() {
    // Hash manager passwords
    await this.hashPasswords('manager', 'manager_id');
      
    // Hash client passwords
    await this.hashPasswords('client', 'client_id');
      
    // Hash admin passwords
    await this.hashPasswords('admin', 'admin_id');
      
    return { success: true, message: 'All passwords have been hashed successfully' };
  }

  private async hashPasswords(tableName: string, idField: string) {
    try {
      // Retrieve users from the specified table
      const users = await this.prisma[tableName].findMany();

      // Loop through each user and hash their password
      for (const user of users) {
        // Check if the password is already hashed (bcrypt hashes are 60 chars)
        if (user.password && user.password.length === 60 && user.password.startsWith('$2')) {
          console.log(`Password for ${tableName} user with ID: ${user[idField]} is already hashed. Skipping...`);
          continue;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Perform update
        await this.prisma[tableName].update({
          where: { [idField]: user[idField] },
          data: { password: hashedPassword },
        });

        console.log(`Updated password for ${tableName} user with ID: ${user[idField]}`);
      }
    } catch (error) {
      console.error(`Error hashing passwords for ${tableName}:`, error);
      throw error;
    }
  }
}

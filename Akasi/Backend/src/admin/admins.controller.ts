import { Controller, Get, Post, Put, Delete, Body, Param} from '@nestjs/common';
import { AdminsService } from './admins.service';

@Controller('admins')
export class AdminsController {
    constructor(private readonly adminsService: AdminsService) {}

    @Get()
    async getAllAdmins() {
        return this.adminsService.getAllAdmins();
    }

    @Post()
    async createAdmin(@Body() adminData: any) {
        return this.adminsService.createAdmin(adminData);
    }

    @Put(':id')
    async updateAdmin(@Param('id') id: string, @Body() adminData: any) {
        return this.adminsService.updateAdmin(parseInt(id), adminData);
    }

    @Delete(':id')
    async deleteAdmin(@Param('id') id: string) {
        return this.adminsService.deleteAdmin(parseInt(id));
    }
}


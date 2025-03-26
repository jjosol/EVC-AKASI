import { Controller, Get } from '@nestjs/common';
import { AdminsService } from './admins.service';

@Controller('admins') // Base route: /admins
export class AdminsController {
    constructor(private readonly adminsService: AdminsService) {}
    @Get() // GET /admins
    async getAllAdmins() {
        return this.adminsService.getAllAdmins();
    }
}

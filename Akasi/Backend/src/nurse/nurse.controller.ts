import { Controller, Get, Post, Put, Delete, Body, Param} from '@nestjs/common';
import { NurseService } from './nurse.service';

@Controller('nurse')
export class NurseController {
    constructor(private readonly nurseService: NurseService) {}

    @Get()
    async getAllNurses() {
        return this.nurseService.getAllNurses();
    }

    @Post()
    async createNurse(@Body() nurseData: any) {
        return this.nurseService.createNurse(nurseData);
    }

    @Put(':id')
    async updateAdmin(@Param('id') id: string, @Body() nurseData: any) {
        return this.nurseService.updateNurse(parseInt(id), nurseData);
    }

    @Delete(':id')
    async deleteNurse(@Param('id') id: string) {
        return this.nurseService.deleteNurse(parseInt(id));
    }
}


import { Body, Controller, Post, Get, Put, Delete, Param, ParseIntPipe, NotFoundException, BadRequestException, Query } from '@nestjs/common';
import { GetClientsService } from './get-clients.service';

@Controller('get-clients')
export class GetClientsController {
    constructor(private readonly GetClientsService: GetClientsService) { }

    @Get('students')
    async findAllStudents() {
        return {
            success: true,
            data: await this.GetClientsService.findAllStudents(),
        };
    }

    @Get('faculty')
    async findAllFaculty() {
        return {
            success: true,
            data: await this.GetClientsService.findAllFaculty(),
        };
    }

    @Get('staff')
    async findAllStaff() {
        return {
            success: true,
            data: await this.GetClientsService.findAllStaff(),
        };
    }
}

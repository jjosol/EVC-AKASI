import { Body, Controller, Post, Get, Put, Delete, Param, ParseIntPipe, NotFoundException, BadRequestException, Query } from '@nestjs/common';
import { GetPatientService } from './get-patient.service';

@Controller('get-patient')
export class GetPatientController {
    constructor(private readonly GetPatientService: GetPatientService) { }

    @Get('students')
    async findAllStudents() {
        return {
            success: true,
            data: await this.GetPatientService.findAllStudents(),
        };
    }

    @Get('faculty')
    async findAllFaculty() {
        return {
            success: true,
            data: await this.GetPatientService.findAllFaculty(),
        };
    }

    @Get('staff')
    async findAllStaff() {
        return {
            success: true,
            data: await this.GetPatientService.findAllStaff(),
        };
    }
}

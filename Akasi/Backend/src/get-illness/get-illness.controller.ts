import { Body, Controller, Post, Get, Put, Delete, Param, ParseIntPipe, NotFoundException, BadRequestException, Query } from '@nestjs/common';
import { GetIllnessService } from './get-illness.service';

@Controller('get-illness')
export class GetIllnessController {
    constructor(private readonly GetPatientService: GetIllnessService) { }

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

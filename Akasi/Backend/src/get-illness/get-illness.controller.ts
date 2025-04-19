import { Body, Controller, Post, Get, Put, Delete, Param, ParseIntPipe, NotFoundException, BadRequestException, Query } from '@nestjs/common';
import { GetIllnessService } from './get-illness.service';

@Controller('get-illness')
export class GetIllnessController {
    constructor(private readonly getIllnessService: GetIllnessService) { }

    @Get('students')
    async findAllStudents() {
        return {
            success: true,
            data: await this.getIllnessService.findAllStudents(),
        };
    }

    @Get('faculty')
    async findAllFaculty() {
        return {
            success: true,
            data: await this.getIllnessService.findAllFaculty(),
        };
    }

    @Get('staff')
    async findAllStaff() {
        return {
            success: true,
            data: await this.getIllnessService.findAllStaff(),
        };
    }

    @Get('report')
    async getIllnessReport(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
        if (!startDate || !endDate) {
            throw new BadRequestException('Start date and end date are required');
        }

        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new BadRequestException('Invalid date format');
            }

            const data = await this.getIllnessService.getIllnessDataByDateRange(start, end);
            return {
                success: true,
                data
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Error fetching illness data: ' + error.message);
        }
    }
}

import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('doctor')
export class DoctorController {
    constructor(private readonly doctorService: DoctorService) {}

    // Get all doctors
    @Get()
    @UseGuards(JwtAuthGuard)
    async getAllDoctors() {
        return this.doctorService.getAllDoctors();
    }

    // Get doctor by ID
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async getDoctorById(@Param('id') id: string) {
        return this.doctorService.getDoctorById(+id);
    }

    // Get current logged-in doctor
    @Get('profile/me')
    @UseGuards(JwtAuthGuard)
    async getCurrentDoctor(@Request() req) {
        // The user ID and role are stored in the request from the JWT auth guard
        if (req.user && req.user.role === 'doctor') {
            return this.doctorService.getDoctorById(req.user.userId);
        }
        return { message: 'Not authorized as a doctor' };
    }

    // Create new doctor
    @Post()
    async createDoctor(@Body() createDoctorDto: { 
        username: string;
        password: string;
        gmail: string;
        name: string;
    }) {
        return this.doctorService.createDoctor(createDoctorDto);
    }
}

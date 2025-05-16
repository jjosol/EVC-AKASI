import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
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

    // Update doctor (adding the missing PUT endpoint)
    @Put(':id')
    async updateDoctor(
        @Param('id') id: string, 
        @Body() updateDoctorDto: {
            username: string;
            password?: string;  // Optional for updates
            gmail: string;
            name: string;
        }
    ) {
        return this.doctorService.updateDoctor(+id, updateDoctorDto);
    }

    // Delete doctor
    @Delete(':id')
    async deleteDoctor(@Param('id') id: string) {
        return this.doctorService.deleteDoctor(+id);
    }
}

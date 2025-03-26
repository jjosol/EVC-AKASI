// src/controllers/client-status.controller.ts
import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ClientStatusService } from './client-status.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller()
export class ClientStatusController {
    constructor(private clientStatusService: ClientStatusService) { }

    /**
     * Retrieves all clients with pending file statuses
     * @returns Array of clients with pending files
     */
    @UseGuards(JwtAuthGuard)
    @Get('students-with-pending-files')
    async getClientsWithPendingFiles() {
        try {
            const clients = await this.clientStatusService.getClientsWithPendingFiles();
            return {
                success: true,
                data: clients,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Updates a client's status based on their file statuses
     * @param clientId The ID of the client to update
     * @returns The updated client
     */
    @UseGuards(JwtAuthGuard)
    @Get('update-client-status/:clientId')
    async updateClientStatus(@Param('clientId', ParseIntPipe) clientId: number) {
        try {
            const updatedClient = await this.clientStatusService.updateClientStatus(clientId);
            return {
                success: true,
                data: updatedClient,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }
}
import { Controller, Get, Post, Put, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ClientsService } from './clients.service';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async getClients() {
    try {
      const clients = await this.clientsService.getClients();
      return clients;
    } catch (error) {
      throw new HttpException(
        'Error fetching clients',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createClient(@Body() clientData: any) {
    try {
      return await this.clientsService.createClient(clientData);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error creating client',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updateClient(@Param('id') id: string, @Body() clientData: any) {
    try {
      return await this.clientsService.updateClient(parseInt(id), clientData);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error updating client',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteClient(@Param('id') id: string) {
    try {
      return await this.clientsService.deleteClient(parseInt(id));
    } catch (error) {
      throw new HttpException(
        error.message || 'Error deleting client',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
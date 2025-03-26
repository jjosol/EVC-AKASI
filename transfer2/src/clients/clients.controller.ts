import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ClientsService } from './clients.service';

@Controller('clients') // This defines the '/clients' route
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get() // This maps HTTP GET requests to this method
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
}

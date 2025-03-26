import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  ParseIntPipe, 
  UseGuards
} from '@nestjs/common';
import { ManagersService } from './managers.service';

@Controller('managers')
export class ManagersController {
  constructor(private readonly managersService: ManagersService) {}

  @Get()
  async getAllManagers() {
    return this.managersService.getAllManagers();
  }

  @Get(':id')
  async getManagerById(@Param('id', ParseIntPipe) id: number) {
    return this.managersService.getManagerById(id);
  }

  @Post()
  async createManager(
    @Body() body: { username: string; password: string; gmail: string }
  ) {
    return this.managersService.createManager(body);
  }

  @Put(':id')
  async updateManager(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { username?: string; password?: string; gmail?: string }
  ) {
    return this.managersService.updateManager(id, body);
  }

  @Delete(':id')
  async deleteManager(@Param('id', ParseIntPipe) id: number) {
    return this.managersService.deleteManager(id);
  }
}

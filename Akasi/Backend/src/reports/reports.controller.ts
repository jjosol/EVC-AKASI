import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('illness-summary')
  async getIllnessSummary(
    @Query('startMonth') startMonth: string,
    @Query('endMonth') endMonth: string,
    @Query('year') year: string,
  ) {
    return this.reportsService.getIllnessSummary(startMonth, endMonth, year);
  }
}
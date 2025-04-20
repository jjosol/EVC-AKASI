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
    if (!startMonth || !year) {
      return { error: 'Start month and year are required' };
    }
    
    // If endMonth is not provided, use startMonth
    const actualEndMonth = endMonth || startMonth;
    
    // Add logging to see what's being passed in
    console.log(`Controller received: startMonth=${startMonth}, endMonth=${actualEndMonth}, year=${year}`);
    
    try {
      const result = await this.reportsService.getIllnessSummary(startMonth, actualEndMonth, year);
      return result;
    } catch (error) {
      console.error('Error generating report:', error);
      return { 
        error: 'Failed to generate report', 
        details: error.message,
        months: [],
        totals: {} 
      };
    }
  }

  @Get('monitoring')
  async getConsultationMonitoring(
    @Query('startMonth') startMonth: string = 'January', 
    @Query('endMonth') endMonth: string = 'December', 
    @Query('year') year: string = new Date().getFullYear().toString()
  ) {
    return this.reportsService.getConsultationMonitoring(startMonth, endMonth, year);
  }

  @Get('common-illnesses')
  async getCommonIllnesses(
    @Query('startMonth') startMonth: string,
    @Query('endMonth') endMonth: string,
    @Query('startYear') startYear: string,
    @Query('endYear') endYear: string,
  ) {
    if (!startMonth || !startYear) {
      return { error: 'Start month and start year are required' };
    }
    
    // If endMonth is not provided, use startMonth
    const actualEndMonth = endMonth || startMonth;
    // If endYear is not provided, use startYear
    const actualEndYear = endYear || startYear;
    
    console.log(`Getting common illnesses: ${startMonth}-${actualEndMonth}, ${startYear}-${actualEndYear}`);
    
    try {
      const result = await this.reportsService.getCommonIllnessesData(startMonth, actualEndMonth, startYear, actualEndYear);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error fetching common illnesses data:', error);
      return { 
        success: false,
        error: 'Failed to fetch common illnesses data', 
        details: error.message
      };
    }
  }
}
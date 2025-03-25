import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getIllnessSummary(startMonth: string, endMonth: string, year: string) {
    // Parse the academic year (e.g., "2023-2024")
    const [startYear, endYear] = year.split('-').map(y => parseInt(y));
    
    // Map month names to month numbers (adjusted for academic year July-June)
    const monthMap = {
      'July': 1, 'August': 2, 'September': 3, 'October': 4, 'November': 5, 'December': 6,
      'January': 7, 'February': 8, 'March': 9, 'April': 10, 'May': 11, 'June': 12
    };
    
    // Generate date ranges for the query
    let startDate: Date, endDate: Date;
    const startMonthNum = monthMap[startMonth];
    const endMonthNum = monthMap[endMonth || startMonth];
    
    // For academic year calculation where months are numbered from July (1) to June (12)
    // Determine the actual calendar year for each month
    const actualStartYear = startMonthNum <= 6 ? endYear : startYear;
    const actualEndYear = endMonthNum <= 6 ? endYear : startYear;
    
    // Convert academic month numbers to calendar month numbers (0-11 for Date constructor)
    const calendarStartMonth = startMonthNum <= 6 ? startMonthNum + 6 : startMonthNum - 7;
    const calendarEndMonth = endMonthNum <= 6 ? endMonthNum + 6 : endMonthNum - 7;
    
    // Set start date to the first day of the start month
    startDate = new Date(actualStartYear, calendarStartMonth, 1);
    
    // Set end date to the last day of the end month
    const lastDay = new Date(actualEndYear, calendarEndMonth + 1, 0).getDate();
    endDate = new Date(actualEndYear, calendarEndMonth, lastDay, 23, 59, 59);

    // Fetch total counts of clients by category and gender
    const totalStudents = await this.prisma.client.groupBy({
      by: ['gender'],
      where: { category: 'Student' },
      _count: { client_id: true },
    });
    
    const totalTeachingStaff = await this.prisma.client.groupBy({
      by: ['gender'],
      where: { category: 'Faculty' },
      _count: { client_id: true },
    });
    
    const totalNonTeachingStaff = await this.prisma.client.groupBy({
      by: ['gender'],
      where: { category: 'Staff' },
      _count: { client_id: true },
    });

    // Fetch consultation counts for each month in the range
    const months = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const month = {
        name: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate),
        year: currentDate.getFullYear(),
        firstDay: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
        lastDay: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59),
      };
      months.push(month);
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // For each month, get the consultation data
    const summaryData = await Promise.all(months.map(async (month) => {
      // Student consultations by gender
      const studentConsultations = await this.prisma.consultation_records.groupBy({
        by: ['client_id'],
        where: {
          date: {
            gte: month.firstDay,
            lte: month.lastDay,
          },
          client: {
            category: 'Student',
          },
        },
        _count: { consultation_id: true },
      });

      const studentMaleConsultations = await this.prisma.consultation_records.groupBy({
        by: ['client_id'],
        where: {
          date: {
            gte: month.firstDay,
            lte: month.lastDay,
          },
          client: {
            category: 'Student',
            gender: 'Male',
          },
        },
        _count: { consultation_id: true },
      });

      const studentFemaleConsultations = await this.prisma.consultation_records.groupBy({
        by: ['client_id'],
        where: {
          date: {
            gte: month.firstDay,
            lte: month.lastDay,
          },
          client: {
            category: 'Student',
            gender: 'Female',
          },
        },
        _count: { consultation_id: true },
      });

      // Teaching staff consultations
      const teachingConsultations = await this.prisma.consultation_records.groupBy({
        by: ['client_id'],
        where: {
          date: {
            gte: month.firstDay,
            lte: month.lastDay,
          },
          client: {
            category: 'Faculty',
          },
        },
        _count: { consultation_id: true },
      });

      const teachingMaleConsultations = await this.prisma.consultation_records.groupBy({
        by: ['client_id'],
        where: {
          date: {
            gte: month.firstDay,
            lte: month.lastDay,
          },
          client: {
            category: 'Faculty',
            gender: 'Male',
          },
        },
        _count: { consultation_id: true },
      });

      const teachingFemaleConsultations = await this.prisma.consultation_records.groupBy({
        by: ['client_id'],
        where: {
          date: {
            gte: month.firstDay,
            lte: month.lastDay,
          },
          client: {
            category: 'Faculty',
            gender: 'Female',
          },
        },
        _count: { consultation_id: true },
      });

      // Non-teaching staff consultations
      const nonTeachingConsultations = await this.prisma.consultation_records.groupBy({
        by: ['client_id'],
        where: {
          date: {
            gte: month.firstDay,
            lte: month.lastDay,
          },
          client: {
            category: 'Staff',
          },
        },
        _count: { consultation_id: true },
      });

      const nonTeachingMaleConsultations = await this.prisma.consultation_records.groupBy({
        by: ['client_id'],
        where: {
          date: {
            gte: month.firstDay,
            lte: month.lastDay,
          },
          client: {
            category: 'Staff',
            gender: 'Male',
          },
        },
        _count: { consultation_id: true },
      });

      const nonTeachingFemaleConsultations = await this.prisma.consultation_records.groupBy({
        by: ['client_id'],
        where: {
          date: {
            gte: month.firstDay,
            lte: month.lastDay,
          },
          client: {
            category: 'Staff',
            gender: 'Female',
          },
        },
        _count: { consultation_id: true },
      });

      // Calculate totals
      const totalMaleStudents = totalStudents.find(g => g.gender === 'Male')?._count?.client_id || 0;
      const totalFemaleStudents = totalStudents.find(g => g.gender === 'Female')?._count?.client_id || 0;
      const totalStudentCount = totalMaleStudents + totalFemaleStudents;
      
      const totalMaleTeaching = totalTeachingStaff.find(g => g.gender === 'Male')?._count?.client_id || 0;
      const totalFemaleTeaching = totalTeachingStaff.find(g => g.gender === 'Female')?._count?.client_id || 0;
      const totalTeachingCount = totalMaleTeaching + totalFemaleTeaching;
      
      const totalMaleNonTeaching = totalNonTeachingStaff.find(g => g.gender === 'Male')?._count?.client_id || 0;
      const totalFemaleNonTeaching = totalNonTeachingStaff.find(g => g.gender === 'Female')?._count?.client_id || 0;
      const totalNonTeachingCount = totalMaleNonTeaching + totalFemaleNonTeaching;

      return {
        month: month.name,
        students: {
          male: studentMaleConsultations.length,
          female: studentFemaleConsultations.length,
          total: studentConsultations.length,
          malePct: totalMaleStudents ? Math.round((studentMaleConsultations.length / totalMaleStudents) * 100) : 0,
          femalePct: totalFemaleStudents ? Math.round((studentFemaleConsultations.length / totalFemaleStudents) * 100) : 0,
          totalPct: totalStudentCount ? Math.round((studentConsultations.length / totalStudentCount) * 100) : 0,
          grandTotal: totalStudentCount
        },
        teachingStaff: {
          male: teachingMaleConsultations.length,
          female: teachingFemaleConsultations.length,
          total: teachingConsultations.length,
          totalCount: totalTeachingCount
        },
        nonTeachingStaff: {
          male: nonTeachingMaleConsultations.length,
          female: nonTeachingFemaleConsultations.length,
          total: nonTeachingConsultations.length,
          totalCount: totalNonTeachingCount
        }
      };
    }));

    return summaryData;
  }
}
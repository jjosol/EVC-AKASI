import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getIllnessSummary(startMonth: string, endMonth: string, year: string) {
    // Convert month names to month numbers
    const monthNameToNumber = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
      'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
    };

    console.log(`Processing request for ${startMonth} to ${endMonth}, ${year}`);
  
    // Add a diagnostic query to check actual data in the table
    const diagnosticQuery = await this.prisma.consultation_records.findMany({
      include: {
        client: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 10 // Get just the latest 10 records to check
    });
    
    console.log('Sample records from consultation_records:', 
      diagnosticQuery.map(r => ({
        id: r.consultation_id,
        client_id: r.client_id,
        date: r.date,
        category: r.client?.category,
        gender: r.client?.gender,
        type: r.client?.type
      }))
    );

    const startMonthNum = monthNameToNumber[startMonth] || parseInt(startMonth);
    const endMonthNum = monthNameToNumber[endMonth] || parseInt(endMonth);
    const yearNum = parseInt(year);

    // Create date range for query
    const startDate = new Date(yearNum, startMonthNum - 1, 1); // Month is 0-indexed in JS Date
    const endDate = new Date(yearNum, endMonthNum, 0); // Last day of end month

    // Prepare the result array with all months in range
    const monthsInRange = [];
    for (let i = startMonthNum; i <= endMonthNum; i++) {
      const date = new Date(yearNum, i - 1, 1);
      const monthName = date.toLocaleString('default', { month: 'long' });
      monthsInRange.push({
        month: monthName,
        students: {
          maleDormers: 0,
          maleExterns: 0,
          femaleDormers: 0,
          femaleExterns: 0,
          total: 0
        },
        faculty: {
          male: 0,
          female: 0,
          total: 0
        },
        staff: {
          male: 0,
          female: 0,
          total: 0
        }
      });
    }

    // Check if we need to use mock data (if database is empty or for testing)
    const useMockData = false;
    
    if (useMockData) {
      console.log('Using mock data for testing');
      return this.generateMockData(startMonthNum, endMonthNum, monthsInRange);
    }

    // Run queries for each category and count
    // 1. Student Male Dormers
    const studentMaleDormers = await this.prisma.consultation_records.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        client: {
          category: 'Student',
          gender: 'Male',
          type: 'Dormer',
        },
      },
      _count: {
        consultation_id: true,
      },
    });

    const maleDormerCount = studentMaleDormers.length;
    console.log(`Found ${maleDormerCount} male dormer students`);

    // 2. Student Male Externs
    const studentMaleExterns = await this.prisma.consultation_records.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        client: {
          category: 'Student',
          gender: 'Male',
          type: 'Extern',
        },
      },
      _count: {
        consultation_id: true,
      },
    });

    // 3. Student Female Dormers
    const studentFemaleDormers = await this.prisma.consultation_records.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        client: {
          category: 'Student',
          gender: 'Female',
          type: 'Dormer',
        },
      },
      _count: {
        consultation_id: true,
      },
    });

    // 4. Student Female Externs
    const studentFemaleExterns = await this.prisma.consultation_records.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        client: {
          category: 'Student',
          gender: 'Female',
          type: 'Extern',
        },
      },
      _count: {
        consultation_id: true,
      },
    });

    // 5. Male Faculty
    const maleFaculty = await this.prisma.consultation_records.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        client: {
          category: 'Faculty',
          gender: 'Male',
        },
      },
      _count: {
        consultation_id: true,
      },
    });

    // 6. Female Faculty
    const femaleFaculty = await this.prisma.consultation_records.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        client: {
          category: 'Faculty',
          gender: 'Female',
        },
      },
      _count: {
        consultation_id: true,
      },
    });

    // 7. Male Staff
    const maleStaff = await this.prisma.consultation_records.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        client: {
          category: 'Staff',
          gender: 'Male',
        },
      },
      _count: {
        consultation_id: true,
      },
    });

    // 8. Female Staff
    const femaleStaff = await this.prisma.consultation_records.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        client: {
          category: 'Staff',
          gender: 'Female',
        },
      },
      _count: {
        consultation_id: true,
      },
    });

    // Process results and update counts by month
    [
      { data: studentMaleDormers, category: 'students', field: 'maleDormers', isGrouped: true },
      { data: studentMaleExterns, category: 'students', field: 'maleExterns', isGrouped: true },
      { data: studentFemaleDormers, category: 'students', field: 'femaleDormers', isGrouped: true },
      { data: studentFemaleExterns, category: 'students', field: 'femaleExterns', isGrouped: true },
      { data: maleFaculty, category: 'faculty', field: 'male', isGrouped: true },
      { data: femaleFaculty, category: 'faculty', field: 'female', isGrouped: true },
      { data: maleStaff, category: 'staff', field: 'male', isGrouped: true },
      { data: femaleStaff, category: 'staff', field: 'female', isGrouped: true },
    ].forEach(({ data, category, field, isGrouped }) => {
      if (data.length === 0) {
        console.log(`No data found for ${category} ${field}`);
        return;
      }
      
      console.log(`Processing ${data.length} records for ${category} ${field}`);
      
      data.forEach(item => {
        try {
          const date = new Date(item.date);
          const month = date.getMonth() + 1; // 1-based month
          const monthIndex = month - startMonthNum;
          
          console.log(`Record date: ${date}, month: ${month}, index: ${monthIndex}`);
          
          if (monthIndex >= 0 && monthIndex < monthsInRange.length) {
            // Different handling based on query type
            if (isGrouped) {
              monthsInRange[monthIndex][category][field] += item._count.consultation_id;
            } else {
              // For findMany results, we just count each record as 1
              monthsInRange[monthIndex][category][field] += 1;
            }
          } else {
            console.log(`Skipping record with monthIndex ${monthIndex} (out of bounds)`);
          }
        } catch (error) {
          console.error(`Error processing record:`, item, error);
        }
      });
    });

    // Calculate totals
    monthsInRange.forEach(month => {
      const students = month.students;
      const faculty = month.faculty;
      const staff = month.staff;

      students.total = students.maleDormers + students.maleExterns + 
                      students.femaleDormers + students.femaleExterns;
      
      faculty.total = faculty.male + faculty.female;
      staff.total = staff.male + staff.female;
    });

    return {
      months: monthsInRange,
      totals: this.calculateTotals(monthsInRange)
    };
  }

  /**
   * Generates mock data for testing the report
   */
  private generateMockData(startMonth: number, endMonth: number, monthsInRange: any[]) {
    // Fill in mock data for each month
    for (let i = 0; i < monthsInRange.length; i++) {
      const month = monthsInRange[i];
      
      // Generate random numbers for each category
      // Students
      month.students.maleDormers = this.getRandomNumber(5, 15);
      month.students.maleExterns = this.getRandomNumber(8, 20);
      month.students.femaleDormers = this.getRandomNumber(6, 18);
      month.students.femaleExterns = this.getRandomNumber(10, 25);
      month.students.total = month.students.maleDormers + month.students.maleExterns + 
                           month.students.femaleDormers + month.students.femaleExterns;
      
      // Faculty
      month.faculty.male = this.getRandomNumber(2, 8);
      month.faculty.female = this.getRandomNumber(3, 10);
      month.faculty.total = month.faculty.male + month.faculty.female;
      
      // Staff
      month.staff.male = this.getRandomNumber(1, 6);
      month.staff.female = this.getRandomNumber(2, 7);
      month.staff.total = month.staff.male + month.staff.female;
    }

    return {
      months: monthsInRange,
      totals: this.calculateTotals(monthsInRange)
    };
  }
  
  /**
   * Generate a random integer between min and max (inclusive)
   */
  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private calculateTotals(months) {
    const totals = {
      students: {
        maleDormers: 0,
        maleExterns: 0,
        femaleDormers: 0,
        femaleExterns: 0,
        total: 0
      },
      faculty: {
        male: 0,
        female: 0,
        total: 0
      },
      staff: {
        male: 0,
        female: 0,
        total: 0
      }
    };

    months.forEach(month => {
      // Students
      totals.students.maleDormers += month.students.maleDormers;
      totals.students.maleExterns += month.students.maleExterns;
      totals.students.femaleDormers += month.students.femaleDormers;
      totals.students.femaleExterns += month.students.femaleExterns;
      
      // Faculty
      totals.faculty.male += month.faculty.male;
      totals.faculty.female += month.faculty.female;
      
      // Staff
      totals.staff.male += month.staff.male;
      totals.staff.female += month.staff.female;
    });

    // Calculate grand totals
    totals.students.total = totals.students.maleDormers + totals.students.maleExterns +
                           totals.students.femaleDormers + totals.students.femaleExterns;
    
    totals.faculty.total = totals.faculty.male + totals.faculty.female;
    totals.staff.total = totals.staff.male + totals.staff.female;

    return totals;
  }
}
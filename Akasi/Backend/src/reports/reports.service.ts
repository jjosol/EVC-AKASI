import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getIllnessSummary(startMonth: string, endMonth: string, startYear: string, endYear: string = startYear) {
    // Convert month names to month numbers
    const monthNameToNumber = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
      'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
    };

    const startMonthNum = monthNameToNumber[startMonth] || parseInt(startMonth);
    const endMonthNum = monthNameToNumber[endMonth] || parseInt(endMonth);
    const startYearNum = parseInt(startYear);
    let endYearNum = parseInt(endYear);

    // ACADEMIC YEAR LOGIC: July-June is one academic year
    // For ANY combination where start month > end month, we're crossing years
    if (startMonthNum > endMonthNum && startYearNum === endYearNum) {
      // If we're crossing years but the same year was provided for both, increment end year
      endYearNum = startYearNum + 1;
      console.log(`Academic year adjustment: Changed end year to ${endYearNum}`);
    }

    // Create date range for query using UTC dates to match database format
    const startDate = new Date(Date.UTC(startYearNum, startMonthNum - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(endYearNum, endMonthNum, 0, 23, 59, 59)); // Last day of end month

    console.log(`Academic year query: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Prepare the result structure with all months in range
    const monthsInRange = [];
    
    // Logic to populate months array with all months in the range
    // Special handling for cross-year ranges (e.g., July-June academic year)
    if (startYearNum === endYearNum && startMonthNum <= endMonthNum) {
      // Simple range within same year (e.g., September-December)
      for (let i = startMonthNum; i <= endMonthNum; i++) {
        const monthName = new Date(startYearNum, i - 1, 1)
                             .toLocaleString('default', { month: 'long' });
        monthsInRange.push({
          month: monthName,
          students: this.createEmptyStudentsObject(),
          faculty: this.createEmptyFacultyObject(),
          staff: this.createEmptyStaffObject()
        });
      }
    } else {
      // Cross-year range (e.g. July to June or December to March)
      // First add months from startMonth to December of start year
      for (let i = startMonthNum; i <= 12; i++) {
        const monthName = new Date(startYearNum, i - 1, 1)
                             .toLocaleString('default', { month: 'long' });
        monthsInRange.push({
          month: monthName,
          students: this.createEmptyStudentsObject(),
          faculty: this.createEmptyFacultyObject(),
          staff: this.createEmptyStaffObject()
        });
      }
      
      // Then add months from January to endMonth of end year
      for (let i = 1; i <= endMonthNum; i++) {
        const monthName = new Date(endYearNum, i - 1, 1)
                             .toLocaleString('default', { month: 'long' });
        monthsInRange.push({
          month: monthName,
          students: this.createEmptyStudentsObject(),
          faculty: this.createEmptyFacultyObject(),
          staff: this.createEmptyStaffObject()
        });
      }
    }

    console.log(`Created ${monthsInRange.length} month entries for report`);

    // Run the database queries for each category as you normally do
    // 1. Student Male Dormers
    const studentMaleDormers = await this.prisma.consultation_records.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        patient: {
          type: 'student',
          gender: 'Male',
          category: 'Intern', // Changed from 'Dormer' to 'Intern' to match schema
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
        patient: {
          type: 'student',
          gender: 'Male',
          category: 'Extern',
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
        patient: {
          type: 'student',
          gender: 'Female',
          category: 'Intern', // Changed from 'Dormer' to 'Intern' to match schema
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
        patient: {
          type: 'student',
          gender: 'Female',
          category: 'Extern',
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
        patient: {
          type: 'faculty',
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
        patient: {
          type: 'faculty',
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
        patient: {
          type: 'staff',
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
        patient: {
          type: 'staff',
          gender: 'Female',
        },
      },
      _count: {
        consultation_id: true,
      },
    });

    // Check if any queries returned data
    const hasRealData = studentMaleDormers.length || studentMaleExterns.length || 
                   studentFemaleDormers.length || studentFemaleExterns.length ||
                   maleFaculty.length || femaleFaculty.length ||
                   maleStaff.length || femaleStaff.length;

    console.log('Query results summary:');
    console.log(`- Male Dormer Students: ${studentMaleDormers.length} records`);
    console.log(`- Male Extern Students: ${studentMaleExterns.length} records`);
    console.log(`- Female Dormer Students: ${studentFemaleDormers.length} records`);
    console.log(`- Female Extern Students: ${studentFemaleExterns.length} records`);
    console.log(`- Male Faculty: ${maleFaculty.length} records`);
    console.log(`- Female Faculty: ${femaleFaculty.length} records`);
    console.log(`- Male Staff: ${maleStaff.length} records`);
    console.log(`- Female Staff: ${femaleStaff.length} records`);
    console.log(`Has real data: ${hasRealData ? 'YES' : 'NO'}`);

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
          // Properly parse the database date which is in ISO format
          const dateObj = new Date(item.date);
          
          // Debug the actual date values
          console.log(`Original date string: ${item.date}`);
          console.log(`Parsed date object: ${dateObj}`);
          console.log(`Year: ${dateObj.getUTCFullYear()}, Month: ${dateObj.getUTCMonth() + 1}`);
          
          // Get the month using UTC methods to avoid timezone issues
          const month = dateObj.getUTCMonth() + 1; // 1-based month (January = 1)
          const year = dateObj.getUTCFullYear();
          
          // Find the index in our monthsInRange array
          let monthIndex = -1;

          if (startYearNum === endYearNum && startMonthNum <= endMonthNum) {
            // Same year case (e.g., Sept-Dec 2024)
            monthIndex = month - startMonthNum;
          } else {
            // Academic year case (e.g., July 2024-June 2025)
            if (year === startYearNum) {
              // Data from start year (e.g., July-December)
              monthIndex = month - startMonthNum;
            } else if (year === endYearNum) {
              // Data from end year (e.g., January-June)
              // Calculate how many months we had in the first year
              const monthsInFirstYear = 13 - startMonthNum;
              monthIndex = monthsInFirstYear + (month - 1);
            } else {
              // This handles any data that might be from years between start and end
              // (in case the range spans more than 2 years)
              console.log(`Data from year ${year} which is neither start nor end year`);
              monthIndex = -1; // Skip this record
            }
          }

          // Add more logging to diagnose the issue
          console.log(`Month: ${month}, Year: ${year}, StartMonth: ${startMonthNum}, StartYear: ${startYearNum}, Index: ${monthIndex}`);
          console.log(`MonthsInRange length: ${monthsInRange.length}`);
          
          if (monthIndex >= 0 && monthIndex < monthsInRange.length) {
            // Count this record in the appropriate category
            if (isGrouped && item._count && item._count.consultation_id) {
              monthsInRange[monthIndex][category][field] += item._count.consultation_id;
              console.log(`Added ${item._count.consultation_id} to ${category}.${field} for month ${month}`);
            } else {
              monthsInRange[monthIndex][category][field] += 1;
              console.log(`Added 1 to ${category}.${field} for month ${month}`);
            }
          } else {
            console.log(`Month ${month} is outside the requested range ${startMonthNum}-${endMonthNum}`);
          }
        } catch (error) {
          console.error(`Error processing date: ${item.date}`, error);
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

  async getConsultationMonitoring(startMonth: string, endMonth: string, startYear: string, endYear: string = startYear) {
    // Convert month names to month numbers
    const monthNameToNumber = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
      'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
    };

    const startMonthNum = monthNameToNumber[startMonth] || parseInt(startMonth);
    const endMonthNum = monthNameToNumber[endMonth] || parseInt(endMonth);
    const startYearNum = parseInt(startYear);
    let endYearNum = parseInt(endYear);

    // ACADEMIC YEAR LOGIC: July-June is one academic year
    // For ANY combination where start month > end month, we're crossing years
    if (startMonthNum > endMonthNum && startYearNum === endYearNum) {
      // If we're crossing years but the same year was provided for both, increment end year
      endYearNum = startYearNum + 1;
      console.log(`Academic year adjustment: Changed end year to ${endYearNum}`);
    }

    // Create date range for query
    const startDate = new Date(Date.UTC(startYearNum, startMonthNum - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(endYearNum, endMonthNum, 0, 23, 59, 59)); // Last day of end month

    console.log(`Fetching consultation monitoring data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    console.log(`Date range spans academic year: ${startYearNum !== endYearNum || startMonthNum > endMonthNum}`);

    // Fetch consultation records with patient information within the date range
    const consultations = await this.prisma.consultation_records.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        patient: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    console.log(`Found ${consultations.length} consultation records`);

    // Format the data as required for the monitoring tool
    return consultations.map(record => {
      const formattedDate = new Date(record.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      
      let gradeSection = '';
      if (record.patient.type === 'student') {
        gradeSection = `${record.patient.grade} - ${record.patient.section}`;
      } else {
        gradeSection = record.patient.type; // faculty or staff
      }

      let patientType = '';
      if (record.patient.type === 'student') {
        patientType = record.patient.category; // Will be 'Intern' or 'Extern'
        
        // Map 'Intern' to 'Dormer' for report display consistency
        if (patientType === 'Intern') {
          patientType = 'Dormer';
        }
      }

      return {
        patientName: record.patient.name,
        gradeSection: gradeSection,
        consultationDate: formattedDate,
        patientType: patientType,
        remarks: record.remarks
      };
    });
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

  // Helper methods to create empty objects
  private createEmptyStudentsObject() {
    return {
      maleDormers: 0,
      maleExterns: 0,
      femaleDormers: 0,
      femaleExterns: 0,
      total: 0
    };
  }

  private createEmptyFacultyObject() {
    return {
      male: 0,
      female: 0,
      total: 0
    };
  }

  private createEmptyStaffObject() {
    return {
      male: 0,
      female: 0,
      total: 0
    };
  }
}
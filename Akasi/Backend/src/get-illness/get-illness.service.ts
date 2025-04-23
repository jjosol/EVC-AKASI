import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GetIllnessService {
  constructor(private prisma: PrismaService) {}

  async findAllStudents() {
    // Get total count of students
    const students = await this.prisma.patient.findMany({
      where: { type: 'student' }
    });
    
    // Get counts by gender
    const maleStudents = students.filter(s => s.gender === 'Male');
    const femaleStudents = students.filter(s => s.gender === 'Female');
    
    // Get common diagnoses for male students
    const maleStudentDiagnoses = await this.getCommonDiagnosesByTypeAndGender('student', 'Male');
    
    // Get common diagnoses for female students
    const femaleStudentDiagnoses = await this.getCommonDiagnosesByTypeAndGender('student', 'Female');
    
    return {
      totalCount: students.length,
      maleCount: maleStudents.length,
      femaleCount: femaleStudents.length,
      maleDiagnoses: maleStudentDiagnoses,
      femaleDiagnoses: femaleStudentDiagnoses
    };
  }
  
  async findAllFaculty() {
    // Get total count of faculty
    const faculty = await this.prisma.patient.findMany({
      where: { type: 'faculty' }
    });
    
    // Get counts by gender
    const maleFaculty = faculty.filter(f => f.gender === 'Male');
    const femaleFaculty = faculty.filter(f => f.gender === 'Female');
    
    // Get common diagnoses for male faculty
    const maleFacultyDiagnoses = await this.getCommonDiagnosesByTypeAndGender('faculty', 'Male');
    
    // Get common diagnoses for female faculty
    const femaleFacultyDiagnoses = await this.getCommonDiagnosesByTypeAndGender('faculty', 'Female');
    
    return {
      totalCount: faculty.length,
      maleCount: maleFaculty.length,
      femaleCount: femaleFaculty.length,
      maleDiagnoses: maleFacultyDiagnoses,
      femaleDiagnoses: femaleFacultyDiagnoses
    };
  }
  
  async findAllStaff() {
    // Combined faculty and staff data
    // Get total count of faculty and staff
    const facultyAndStaff = await this.prisma.patient.findMany({
      where: {
        type: {
          in: ['faculty', 'staff']
        }
      }
    });
    
    // Get counts by gender
    const maleFacultyStaff = facultyAndStaff.filter(p => p.gender === 'Male');
    const femaleFacultyStaff = facultyAndStaff.filter(p => p.gender === 'Female');
    
    // Get common diagnoses for male faculty and staff
    const maleFacultyStaffDiagnoses = await this.getCommonDiagnosesByTypesAndGender(['faculty', 'staff'], 'Male');
    
    // Get common diagnoses for female faculty and staff
    const femaleFacultyStaffDiagnoses = await this.getCommonDiagnosesByTypesAndGender(['faculty', 'staff'], 'Female');
    
    return {
      totalCount: facultyAndStaff.length,
      maleCount: maleFacultyStaff.length,
      femaleCount: femaleFacultyStaff.length,
      maleDiagnoses: maleFacultyStaffDiagnoses,
      femaleDiagnoses: femaleFacultyStaffDiagnoses
    };
  }
  
  // Get the most common diagnoses and their interventions for a specific patient type and gender
  async getCommonDiagnosesByTypeAndGender(patientType: string, gender: string) {
    // 1. Get patients of the specified type and gender
    const patients = await this.prisma.patient.findMany({
      where: {
        type: patientType,
        gender: gender
      },
      select: {
        patient_id: true
      }
    });
    
    const patientIds = patients.map(p => p.patient_id);
    
    // 2. Get all consultation records for these patients with their diagnoses
    const consultations = await this.prisma.consultation_records.findMany({
      where: {
        patient_id: {
          in: patientIds
        }
      },
      include: {
        diagnosis: {
          include: {
            diagnosis: true
          }
        }
      }
    });
    
    return this.processDiagnosesWithInterventions(consultations);
  }
  
  // Get the most common diagnoses for multiple patient types (like faculty AND staff) and gender
  async getCommonDiagnosesByTypesAndGender(patientTypes: string[], gender: string) {
    // 1. Get patients of the specified types and gender
    const patients = await this.prisma.patient.findMany({
      where: {
        type: {
          in: patientTypes
        },
        gender: gender
      },
      select: {
        patient_id: true
      }
    });
    
    const patientIds = patients.map(p => p.patient_id);
    
    // 2. Get all consultation records for these patients with their diagnoses
    const consultations = await this.prisma.consultation_records.findMany({
      where: {
        patient_id: {
          in: patientIds
        }
      },
      include: {
        diagnosis: {
          include: {
            diagnosis: true
          }
        }
      }
    });
    
    return this.processDiagnosesWithInterventions(consultations);
  }

  // Helper method to process diagnoses and their interventions from consultations
  private processDiagnosesWithInterventions(consultations: any[]) {
    // 3. Count diagnoses and gather interventions
    const diagnosisCounts = new Map();
    const diagnosisInterventions = new Map();
    
    for (const consultation of consultations) {
      for (const diagRel of consultation.diagnosis) {
        const diagName = diagRel.diagnosis.name;
        const intervention = consultation.intervention;
        
        // Count occurrences of this diagnosis
        if (!diagnosisCounts.has(diagName)) {
          diagnosisCounts.set(diagName, 0);
          diagnosisInterventions.set(diagName, new Set());
        }
        
        diagnosisCounts.set(diagName, diagnosisCounts.get(diagName) + 1);
        if (intervention && intervention.trim() !== '') {
          diagnosisInterventions.get(diagName).add(intervention);
        }
      }
    }
    
    // 4. Sort diagnoses by count and take top 2
    const sortedDiagnoses = [...diagnosisCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
    
    // 5. Format the result with diagnoses and their interventions
    return sortedDiagnoses.map(([diagName, count]) => {
      const interventions = Array.from(diagnosisInterventions.get(diagName));
      return {
        name: diagName,
        count: count,
        interventions: interventions.join('; ')
      };
    });
  }

  // Additional method to get data for a specific date range
  async getIllnessDataByDateRange(startDate: Date, endDate: Date) {
    // Get data for students
    const studentsData = await this.getStudentDataByDateRange(startDate, endDate);
    
    // Get combined faculty and staff data
    const facultyStaffData = await this.getStaffDataByDateRange(startDate, endDate);
    
    return {
      students: studentsData,
      facultyStaff: facultyStaffData
    };
  }
  
  async getStudentDataByDateRange(startDate: Date, endDate: Date) {
    // Get total count of students
    const students = await this.prisma.patient.count({
      where: { type: 'student' }
    });
    
    // Get counts by gender
    const maleStudents = await this.prisma.patient.count({
      where: { 
        type: 'student',
        gender: 'Male'
      }
    });
    
    const femaleStudents = await this.prisma.patient.count({
      where: { 
        type: 'student',
        gender: 'Female'
      }
    });
    
    // Get patients IDs of the specified type
    const patientIds = await this.prisma.patient.findMany({
      where: {
        type: 'student'
      },
      select: {
        patient_id: true,
        gender: true
      }
    });
    
    // Get consultations in the date range
    const consultations = await this.prisma.consultation_records.findMany({
      where: {
        patient_id: {
          in: patientIds.map(p => p.patient_id)
        },
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        diagnosis: {
          include: {
            diagnosis: true
          }
        },
        patient: true
      }
    });
    
    // Group by gender and get top diagnoses
    const maleConsults = consultations.filter(c => c.patient.gender === 'Male');
    const femaleConsults = consultations.filter(c => c.patient.gender === 'Female');
    
    // Process diagnoses for males
    const maleDiagnoses = this.processDiagnosesWithInterventions(maleConsults);
    
    // Process diagnoses for females
    const femaleDiagnoses = this.processDiagnosesWithInterventions(femaleConsults);
    
    return {
      totalCount: students,
      maleCount: maleStudents,
      femaleCount: femaleStudents,
      maleDiagnoses,
      femaleDiagnoses
    };
  }
  
  async getStaffDataByDateRange(startDate: Date, endDate: Date) {
    // Get combined faculty and staff count
    const facultyStaff = await this.prisma.patient.count({
      where: { 
        type: {
          in: ['faculty', 'staff']
        }
      }
    });
    
    // Get counts by gender
    const maleFacultyStaff = await this.prisma.patient.count({
      where: { 
        type: {
          in: ['faculty', 'staff']
        },
        gender: 'Male'
      }
    });
    
    const femaleFacultyStaff = await this.prisma.patient.count({
      where: { 
        type: {
          in: ['faculty', 'staff']
        },
        gender: 'Female'
      }
    });
    
    // Get patient IDs for faculty and staff
    const patientIds = await this.prisma.patient.findMany({
      where: {
        type: {
          in: ['faculty', 'staff']
        }
      },
      select: {
        patient_id: true,
        gender: true
      }
    });
    
    // Get consultations in the date range
    const consultations = await this.prisma.consultation_records.findMany({
      where: {
        patient_id: {
          in: patientIds.map(p => p.patient_id)
        },
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        diagnosis: {
          include: {
            diagnosis: true
          }
        },
        patient: true
      }
    });
    
    // Group by gender and get top diagnoses
    const maleConsults = consultations.filter(c => c.patient.gender === 'Male');
    const femaleConsults = consultations.filter(c => c.patient.gender === 'Female');
    
    // Process diagnoses for males
    const maleDiagnoses = this.processDiagnosesWithInterventions(maleConsults);
    
    // Process diagnoses for females
    const femaleDiagnoses = this.processDiagnosesWithInterventions(femaleConsults);
    
    return {
      totalCount: facultyStaff,
      maleCount: maleFacultyStaff,
      femaleCount: femaleFacultyStaff,
      maleDiagnoses,
      femaleDiagnoses
    };
  }
}
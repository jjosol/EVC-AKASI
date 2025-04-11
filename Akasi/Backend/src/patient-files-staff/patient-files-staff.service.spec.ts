import { Test, TestingModule } from '@nestjs/testing';
import { PatientFilesStaffService } from './patient-files-staff.service';

describe('PatientFilesStaffService', () => {
  let service: PatientFilesStaffService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientFilesStaffService],
    }).compile();

    service = module.get<PatientFilesStaffService>(PatientFilesStaffService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

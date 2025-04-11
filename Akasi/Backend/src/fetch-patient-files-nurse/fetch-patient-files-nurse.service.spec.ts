import { Test, TestingModule } from '@nestjs/testing';
import { FetchPatientFilesNurseService } from './fetch-patient-files-nurse.service';

describe('FetchClientFilesAdminService', () => {
  let service: FetchPatientFilesNurseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FetchPatientFilesNurseService],
    }).compile();

    service = module.get<FetchPatientFilesNurseService>(FetchPatientFilesNurseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

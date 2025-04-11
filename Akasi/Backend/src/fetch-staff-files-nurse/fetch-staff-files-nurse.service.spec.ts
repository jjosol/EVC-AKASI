import { Test, TestingModule } from '@nestjs/testing';
import { FetchStaffFilesNurseService } from './fetch-staff-files-nurse.service';

describe('FetchStaffFilesNurseService', () => {
  let service: FetchStaffFilesNurseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FetchStaffFilesNurseService],
    }).compile();

    service = module.get<FetchStaffFilesNurseService>(FetchStaffFilesNurseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

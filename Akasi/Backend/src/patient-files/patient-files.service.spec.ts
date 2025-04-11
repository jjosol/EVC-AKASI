import { Test, TestingModule } from '@nestjs/testing';
import { PatientFilesService } from './patient-files.service';

describe('PatientFilesService', () => {
  let service: PatientFilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientFilesService],
    }).compile();

    service = module.get<PatientFilesService>(PatientFilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

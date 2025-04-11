import { Test, TestingModule } from '@nestjs/testing';
import { FetchPatientFilesService } from './fetch-patient-files.service';

describe('FetchClientFilesService', () => {
  let service: FetchPatientFilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FetchPatientFilesService],
    }).compile();

    service = module.get<FetchPatientFilesService>(FetchPatientFilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

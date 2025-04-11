import { Test, TestingModule } from '@nestjs/testing';
import { PatientStatusService } from './patient-status.service';

describe('PatientStatusService', () => {
  let service: PatientStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientStatusService],
    }).compile();

    service = module.get<PatientStatusService>(PatientStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { GetPatientService } from './get-patient.service';

describe('GetPatientService', () => {
  let service: GetPatientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GetPatientService],
    }).compile();

    service = module.get<GetPatientService>(GetPatientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { GetPatientConsultationsService } from './get-patient-consultations.service';

describe('GetPatientConsultationsService', () => {
  let service: GetPatientConsultationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GetPatientConsultationsService],
    }).compile();

    service = module.get<GetPatientConsultationsService>(GetPatientConsultationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

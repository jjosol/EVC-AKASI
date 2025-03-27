import { Test, TestingModule } from '@nestjs/testing';
import { GetClientConsultationsService } from './get-client-consultations.service';

describe('GetClientConsultationsService', () => {
  let service: GetClientConsultationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GetClientConsultationsService],
    }).compile();

    service = module.get<GetClientConsultationsService>(GetClientConsultationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

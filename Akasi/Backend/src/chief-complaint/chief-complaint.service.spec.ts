import { Test, TestingModule } from '@nestjs/testing';
import { ChiefComplaintService } from './chief-complaint.service';

describe('ChiefComplaintService', () => {
  let service: ChiefComplaintService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChiefComplaintService],
    }).compile();

    service = module.get<ChiefComplaintService>(ChiefComplaintService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

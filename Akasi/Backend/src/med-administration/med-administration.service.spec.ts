import { Test, TestingModule } from '@nestjs/testing';
import { MedAdministrationService } from './med-administration.service';

describe('MedAdministrationService', () => {
  let service: MedAdministrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedAdministrationService],
    }).compile();

    service = module.get<MedAdministrationService>(MedAdministrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

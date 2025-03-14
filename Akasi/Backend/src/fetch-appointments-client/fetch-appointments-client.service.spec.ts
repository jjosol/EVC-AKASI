import { Test, TestingModule } from '@nestjs/testing';
import { FetchAppointmentsClientService } from './fetch-appointments-client.service';

describe('FetchAppointmentsClientService', () => {
  let service: FetchAppointmentsClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FetchAppointmentsClientService],
    }).compile();

    service = module.get<FetchAppointmentsClientService>(FetchAppointmentsClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

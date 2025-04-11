import { Test, TestingModule } from '@nestjs/testing';
import { FetchAppointmentsPatientService } from './fetch-appointments-patient.service';

describe('FetchAppointmentsClientService', () => {
  let service: FetchAppointmentsPatientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FetchAppointmentsPatientService],
    }).compile();

    service = module.get<FetchAppointmentsPatientService>(FetchAppointmentsPatientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

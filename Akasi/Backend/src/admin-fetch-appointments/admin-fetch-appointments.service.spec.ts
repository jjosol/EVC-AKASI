import { Test, TestingModule } from '@nestjs/testing';
import { AdminFetchAppointmentsService } from './admin-fetch-appointments.service';

describe('AdminFetchAppointmentsService', () => {
  let service: AdminFetchAppointmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminFetchAppointmentsService],
    }).compile();

    service = module.get<AdminFetchAppointmentsService>(AdminFetchAppointmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { DailyAppointmentService } from './daily-appointment.service';

describe('DailyAppointmentService', () => {
  let service: DailyAppointmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DailyAppointmentService],
    }).compile();

    service = module.get<DailyAppointmentService>(DailyAppointmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

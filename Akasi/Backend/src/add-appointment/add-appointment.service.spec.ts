import { Test, TestingModule } from '@nestjs/testing';
import { AddAppointmentService } from './add-appointment.service';

describe('AddAppointmentService', () => {
  let service: AddAppointmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddAppointmentService],
    }).compile();

    service = module.get<AddAppointmentService>(AddAppointmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { DailyAppointmentController } from './daily-appointment.controller';

describe('AdminFetchAppointmentsController', () => {
  let controller: DailyAppointmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DailyAppointmentController],
    }).compile();

    controller = module.get<DailyAppointmentController>(DailyAppointmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

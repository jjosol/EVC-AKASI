import { Test, TestingModule } from '@nestjs/testing';
import { AdminFetchAppointmentsController } from './admin-fetch-appointments.controller';

describe('AdminFetchAppointmentsController', () => {
  let controller: AdminFetchAppointmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminFetchAppointmentsController],
    }).compile();

    controller = module.get<AdminFetchAppointmentsController>(AdminFetchAppointmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AddAppointmentController } from './add-appointment.controller';

describe('AddAppointmentController', () => {
  let controller: AddAppointmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddAppointmentController],
    }).compile();

    controller = module.get<AddAppointmentController>(AddAppointmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

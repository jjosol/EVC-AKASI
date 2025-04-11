import { Test, TestingModule } from '@nestjs/testing';
import { FetchAppointmentsPatientController } from './fetch-appointments-patient.controller';

describe('FetchAppointmentsClientController', () => {
  let controller: FetchAppointmentsPatientController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FetchAppointmentsPatientController],
    }).compile();

    controller = module.get<FetchAppointmentsPatientController>(FetchAppointmentsPatientController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

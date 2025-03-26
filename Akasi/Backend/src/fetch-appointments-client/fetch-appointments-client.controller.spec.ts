import { Test, TestingModule } from '@nestjs/testing';
import { FetchAppointmentsClientController } from './fetch-appointments-client.controller';

describe('FetchAppointmentsClientController', () => {
  let controller: FetchAppointmentsClientController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FetchAppointmentsClientController],
    }).compile();

    controller = module.get<FetchAppointmentsClientController>(FetchAppointmentsClientController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

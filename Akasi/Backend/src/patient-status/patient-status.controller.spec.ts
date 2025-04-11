import { Test, TestingModule } from '@nestjs/testing';
import { PatientStatusController } from './patient-status.controller';

describe('PatientStatusController', () => {
  let controller: PatientStatusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientStatusController],
    }).compile();

    controller = module.get<PatientStatusController>(PatientStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

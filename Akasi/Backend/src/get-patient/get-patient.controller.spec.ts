import { Test, TestingModule } from '@nestjs/testing';
import { GetPatientController } from './get-patient.controller';

describe('GetPatientController', () => {
  let controller: GetPatientController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetPatientController],
    }).compile();

    controller = module.get<GetPatientController>(GetPatientController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

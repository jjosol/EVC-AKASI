import { Test, TestingModule } from '@nestjs/testing';
import { GetPatientConsultationsController } from './get-patient-consultations.controller';

describe('GetPatientConsultationsController', () => {
  let controller: GetPatientConsultationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetPatientConsultationsController],
    }).compile();

    controller = module.get<GetPatientConsultationsController>(GetPatientConsultationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

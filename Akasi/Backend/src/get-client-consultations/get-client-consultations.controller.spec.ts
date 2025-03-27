import { Test, TestingModule } from '@nestjs/testing';
import { GetClientConsultationsController } from './get-client-consultations.controller';

describe('GetClientConsultationsController', () => {
  let controller: GetClientConsultationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetClientConsultationsController],
    }).compile();

    controller = module.get<GetClientConsultationsController>(GetClientConsultationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

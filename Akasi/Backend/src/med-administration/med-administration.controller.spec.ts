import { Test, TestingModule } from '@nestjs/testing';
import { MedAdministrationController } from './med-administration.controller';

describe('MedAdministrationController', () => {
  let controller: MedAdministrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedAdministrationController],
    }).compile();

    controller = module.get<MedAdministrationController>(MedAdministrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

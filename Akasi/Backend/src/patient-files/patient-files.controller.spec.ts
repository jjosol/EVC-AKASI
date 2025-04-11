import { Test, TestingModule } from '@nestjs/testing';
import { PatientFilesController } from './patient-files.controller';

describe('PatientFilesController', () => {
  let controller: PatientFilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientFilesController],
    }).compile();

    controller = module.get<PatientFilesController>(PatientFilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

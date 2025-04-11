import { Test, TestingModule } from '@nestjs/testing';
import { FetchPatientFilesController } from './fetch-patient-files.controller';

describe('FetchClientFilesController', () => {
  let controller: FetchPatientFilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FetchPatientFilesController],
    }).compile();

    controller = module.get<FetchPatientFilesController>(FetchPatientFilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

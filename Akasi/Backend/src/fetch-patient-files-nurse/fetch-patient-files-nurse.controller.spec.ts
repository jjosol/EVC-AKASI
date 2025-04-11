import { Test, TestingModule } from '@nestjs/testing';
import { FetchPatientFilesNurseController } from './fetch-patient-files-nurse.controller';

describe('FetchClientFilesNurseController', () => {
  let controller: FetchPatientFilesNurseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FetchPatientFilesNurseController],
    }).compile();

    controller = module.get<FetchPatientFilesNurseController>(FetchPatientFilesNurseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

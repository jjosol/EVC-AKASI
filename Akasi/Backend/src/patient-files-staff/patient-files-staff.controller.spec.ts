import { Test, TestingModule } from '@nestjs/testing';
import { PatientFilesStaffController } from './patient-files-staff.controller';

describe('PatientFilesStaffController', () => {
  let controller: PatientFilesStaffController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientFilesStaffController],
    }).compile();

    controller = module.get<PatientFilesStaffController>(PatientFilesStaffController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

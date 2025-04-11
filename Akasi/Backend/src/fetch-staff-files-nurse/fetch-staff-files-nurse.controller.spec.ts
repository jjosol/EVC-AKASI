import { Test, TestingModule } from '@nestjs/testing';
import { FetchStaffFilesNurseController } from './fetch-staff-files-nurse.controller';

describe('FetchStaffFilesNurseController', () => {
  let controller: FetchStaffFilesNurseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FetchStaffFilesNurseController],
    }).compile();

    controller = module.get<FetchStaffFilesNurseController>(FetchStaffFilesNurseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

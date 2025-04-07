import { Test, TestingModule } from '@nestjs/testing';
import { FetchStaffFilesAdminController } from './fetch-staff-files-admin.controller';

describe('FetchStaffFilesAdminController', () => {
  let controller: FetchStaffFilesAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FetchStaffFilesAdminController],
    }).compile();

    controller = module.get<FetchStaffFilesAdminController>(FetchStaffFilesAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

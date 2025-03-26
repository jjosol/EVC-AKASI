import { Test, TestingModule } from '@nestjs/testing';
import { FetchClientFilesAdminController } from './fetch-client-files-admin.controller';

describe('FetchClientFilesAdminController', () => {
  let controller: FetchClientFilesAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FetchClientFilesAdminController],
    }).compile();

    controller = module.get<FetchClientFilesAdminController>(FetchClientFilesAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

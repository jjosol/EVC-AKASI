import { Test, TestingModule } from '@nestjs/testing';
import { FetchClientFilesController } from './fetch-client-files.controller';

describe('FetchClientFilesController', () => {
  let controller: FetchClientFilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FetchClientFilesController],
    }).compile();

    controller = module.get<FetchClientFilesController>(FetchClientFilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { FileStatusController } from './file-status.controller';

describe('FileStatusController', () => {
  let controller: FileStatusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileStatusController],
    }).compile();

    controller = module.get<FileStatusController>(FileStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

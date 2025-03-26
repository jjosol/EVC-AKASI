import { Test, TestingModule } from '@nestjs/testing';
import { ClientFilesController } from './client-files.controller';

describe('ClientFilesController', () => {
  let controller: ClientFilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientFilesController],
    }).compile();

    controller = module.get<ClientFilesController>(ClientFilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

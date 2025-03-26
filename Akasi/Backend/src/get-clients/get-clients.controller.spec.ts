import { Test, TestingModule } from '@nestjs/testing';
import { GetClientsController } from './get-clients.controller';

describe('GetClientsController', () => {
  let controller: GetClientsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetClientsController],
    }).compile();

    controller = module.get<GetClientsController>(GetClientsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

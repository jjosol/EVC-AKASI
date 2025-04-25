import { Test, TestingModule } from '@nestjs/testing';
import { ChiefComplaintController } from './chief-complaint.controller';

describe('ChiefComplaintController', () => {
  let controller: ChiefComplaintController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChiefComplaintController],
    }).compile();

    controller = module.get<ChiefComplaintController>(ChiefComplaintController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

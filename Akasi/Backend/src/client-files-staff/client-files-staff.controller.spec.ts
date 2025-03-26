import { Test, TestingModule } from '@nestjs/testing';
import { ClientFilesStaffController } from './client-files-staff.controller';

describe('ClientFilesStaffController', () => {
  let controller: ClientFilesStaffController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientFilesStaffController],
    }).compile();

    controller = module.get<ClientFilesStaffController>(ClientFilesStaffController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

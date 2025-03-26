import { Test, TestingModule } from '@nestjs/testing';
import { ClientFilesStaffService } from './client-files-staff.service';

describe('ClientFilesStaffService', () => {
  let service: ClientFilesStaffService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientFilesStaffService],
    }).compile();

    service = module.get<ClientFilesStaffService>(ClientFilesStaffService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { FetchStaffFilesAdminService } from './fetch-staff-files-admin.service';

describe('FetchStaffFilesAdminService', () => {
  let service: FetchStaffFilesAdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FetchStaffFilesAdminService],
    }).compile();

    service = module.get<FetchStaffFilesAdminService>(FetchStaffFilesAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

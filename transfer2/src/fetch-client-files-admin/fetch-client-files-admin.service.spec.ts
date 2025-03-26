import { Test, TestingModule } from '@nestjs/testing';
import { FetchClientFilesAdminService } from './fetch-client-files-admin.service';

describe('FetchClientFilesAdminService', () => {
  let service: FetchClientFilesAdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FetchClientFilesAdminService],
    }).compile();

    service = module.get<FetchClientFilesAdminService>(FetchClientFilesAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

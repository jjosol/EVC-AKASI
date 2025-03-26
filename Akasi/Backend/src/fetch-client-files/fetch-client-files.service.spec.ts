import { Test, TestingModule } from '@nestjs/testing';
import { FetchClientFilesService } from './fetch-client-files.service';

describe('FetchClientFilesService', () => {
  let service: FetchClientFilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FetchClientFilesService],
    }).compile();

    service = module.get<FetchClientFilesService>(FetchClientFilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

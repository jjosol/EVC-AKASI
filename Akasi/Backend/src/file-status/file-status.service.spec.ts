import { Test, TestingModule } from '@nestjs/testing';
import { FileStatusService } from './file-status.service';

describe('FileStatusService', () => {
  let service: FileStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileStatusService],
    }).compile();

    service = module.get<FileStatusService>(FileStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

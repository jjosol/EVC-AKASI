import { Test, TestingModule } from '@nestjs/testing';
import { ClientFilesService } from './client-files.service';

describe('ClientFilesService', () => {
  let service: ClientFilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientFilesService],
    }).compile();

    service = module.get<ClientFilesService>(ClientFilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

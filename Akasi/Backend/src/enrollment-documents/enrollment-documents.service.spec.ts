import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentDocumentsService } from './enrollment-documents.service';

describe('EnrollmentDocumentsService', () => {
  let service: EnrollmentDocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnrollmentDocumentsService],
    }).compile();

    service = module.get<EnrollmentDocumentsService>(EnrollmentDocumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

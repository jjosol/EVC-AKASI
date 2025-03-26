import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentDocumentsController } from './enrollment-documents.controller';

describe('EnrollmentDocumentsController', () => {
  let controller: EnrollmentDocumentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentDocumentsController],
    }).compile();

    controller = module.get<EnrollmentDocumentsController>(EnrollmentDocumentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

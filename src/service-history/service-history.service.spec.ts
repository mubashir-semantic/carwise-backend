import { Test, TestingModule } from '@nestjs/testing';
import { ServiceHistoryService } from './service-history.service';

describe('ServiceHistoryService', () => {
  let service: ServiceHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceHistoryService],
    }).compile();

    service = module.get<ServiceHistoryService>(ServiceHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseHistoryService } from './expense-history.service';

describe('ExpenseHistoryService', () => {
  let service: ExpenseHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpenseHistoryService],
    }).compile();

    service = module.get<ExpenseHistoryService>(ExpenseHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseHistoryController } from './expense-history.controller';

describe('ExpenseHistoryController', () => {
  let controller: ExpenseHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpenseHistoryController],
    }).compile();

    controller = module.get<ExpenseHistoryController>(ExpenseHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

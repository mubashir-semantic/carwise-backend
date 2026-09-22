import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExpenseHistory } from './schemas/expense-history.schema';
import { CreateExpenseHistoryDto } from './dto/create-expense-history.dto';

@Injectable()
export class ExpenseHistoryService {
  constructor(
    @InjectModel(ExpenseHistory.name)
    private expenseModel: Model<ExpenseHistory>,
  ) {}

  async create(createDto: CreateExpenseHistoryDto): Promise<ExpenseHistory> {
    const newExpense = new this.expenseModel(createDto);
    return newExpense.save();
  }

  async findAll(): Promise<ExpenseHistory[]> {
    return this.expenseModel.find().sort({ createdAt: -1 }).exec();
  }
}
    
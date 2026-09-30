import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { ExpenseHistory } from './schemas/expense-history.schema';
import { CreateExpenseHistoryDto } from './dto/create-expense-history.dto';
import { UpdateExpenseHistoryDto } from './dto/update-expense-history.dto';

@Injectable()
export class ExpenseHistoryService {
  constructor(
    @InjectModel(ExpenseHistory.name)
    private expenseModel: Model<ExpenseHistory>,
  ) {}

  // Galat id par 500 ki jagah 400 dene ke liye
  private assertValidId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid expense history id');
    }
  }

  async create(createDto: CreateExpenseHistoryDto): Promise<ExpenseHistory> {
    const newExpense = new this.expenseModel(createDto);
    return newExpense.save();
  }

  async findAll(): Promise<ExpenseHistory[]> {
    return this.expenseModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<ExpenseHistory> {
    this.assertValidId(id);
    const record = await this.expenseModel.findById(id).exec();
    if (!record) {
      throw new NotFoundException('Expense history record not found');
    }
    return record;
  }

  async update(
    id: string,
    updateDto: UpdateExpenseHistoryDto,
  ): Promise<ExpenseHistory> {
    this.assertValidId(id);
    const record = await this.expenseModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
    if (!record) {
      throw new NotFoundException('Expense history record not found');
    }
    return record;
  }

  async remove(id: string): Promise<{ message: string }> {
    this.assertValidId(id);
    const record = await this.expenseModel.findByIdAndDelete(id).exec();
    if (!record) {
      throw new NotFoundException('Expense history record not found');
    }
    return { message: 'Expense history record deleted successfully' };
  }
}

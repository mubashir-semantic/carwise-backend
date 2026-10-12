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
import { Role } from '../auth/roles.enum'; // Role enum import kiya hai
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ExpenseHistoryService {
  constructor(
    @InjectModel(ExpenseHistory.name)
    private expenseModel: Model<ExpenseHistory>,
    private notificationsService: NotificationsService,
  ) {}

  // Galat id par 500 ki jagah 400 dene ke liye
  private assertValidId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid expense history id');
    }
  }

  // Record ke owner ko notification bhejna (fail bhi ho to asli kaam nahi rukta)
  private async notifyOwner(record: unknown, text: string) {
    const ownerId = (record as { userId?: unknown }).userId;
    if (!ownerId) return;
    await this.notificationsService.notify({
      recipientId: String(ownerId),
      text,
      category: 'expense',
    });
  }

  // Yahan userId parameter add kiya gaya hai
  async create(
    createDto: CreateExpenseHistoryDto,
    userId: string,
  ): Promise<ExpenseHistory> {
    const newExpense = new this.expenseModel({
      ...createDto,
      userId, // DTO ke sath userId save karwa rahe hain
    });
    const saved = await newExpense.save();

    // Notification: expense add hone par (fail bhi ho to expense save rahega)
    await this.notificationsService.notify({
      recipientId: userId,
      text: 'A new expense was added to your expense history.',
      category: 'expense',
    });

    return saved;
  }

  // Yahan user object parameter add kiya gaya hai aur role check lagaya hai
  async findAll(user: any): Promise<ExpenseHistory[]> {
    // Agar customer hai toh sirf uske apne expense records dikhao
    if (user.role === Role.CUSTOMER) {
      return this.expenseModel
        .find({ userId: user.userId })
        .sort({ createdAt: -1 })
        .exec();
    }
    // Admin aur Workshop Staff ko saare records dikhao
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
    await this.notifyOwner(
      record,
      'An expense record in your history was updated.',
    );
    return record;
  }

  async remove(id: string): Promise<{ message: string }> {
    this.assertValidId(id);
    const record = await this.expenseModel.findByIdAndDelete(id).exec();
    if (!record) {
      throw new NotFoundException('Expense history record not found');
    }
    await this.notifyOwner(
      record,
      'An expense record was deleted from your history.',
    );
    return { message: 'Expense history record deleted successfully' };
  }
}

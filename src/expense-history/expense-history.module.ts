import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpenseHistoryController } from './expense-history.controller';
import { ExpenseHistoryService } from './expense-history.service';
import {
  ExpenseHistory,
  ExpenseHistorySchema,
} from './schemas/expense-history.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExpenseHistory.name, schema: ExpenseHistorySchema },
    ]),
    NotificationsModule,
  ],
  controllers: [ExpenseHistoryController],
  providers: [ExpenseHistoryService],
})
export class ExpenseHistoryModule {}

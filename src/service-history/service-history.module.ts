import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceHistoryController } from './service-history.controller';
import { ServiceHistoryService } from './service-history.service';
import {
  ServiceHistory,
  ServiceHistorySchema,
} from './schemas/service-history.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceHistory.name, schema: ServiceHistorySchema },
    ]),
    NotificationsModule,
  ],
  controllers: [ServiceHistoryController],
  providers: [ServiceHistoryService],
})
export class ServiceHistoryModule {}

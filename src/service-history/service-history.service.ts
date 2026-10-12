import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { ServiceHistory } from './schemas/service-history.schema';
import { CreateServiceHistoryDto } from './dto/create-service-history.dto';
import { UpdateServiceHistoryDto } from './dto/update-service-history.dto';
import { Role } from '../auth/roles.enum';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ServiceHistoryService {
  constructor(
    @InjectModel(ServiceHistory.name)
    private serviceModel: Model<ServiceHistory>,
    private notificationsService: NotificationsService,
  ) {}

  private assertValidId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid service history id');
    }
  }

  // Record ke owner ko notification bhejna (fail bhi ho to asli kaam nahi rukta)
  private async notifyOwner(record: unknown, text: string) {
    const ownerId = (record as { userId?: unknown }).userId;
    if (!ownerId) return;
    await this.notificationsService.notify({
      recipientId: String(ownerId),
      text,
      category: 'service',
    });
  }

  async create(
    createDto: CreateServiceHistoryDto,
    userId: string,
  ): Promise<ServiceHistory> {
    const newService = new this.serviceModel({
      ...createDto,
      userId,
    });
    const saved = await newService.save();

    // Notification: service record add hone par (fail bhi ho to record save rahega)
    await this.notificationsService.notify({
      recipientId: userId,
      text: 'A new service record was added to your service history.',
      category: 'service',
    });

    return saved;
  }

  async findAll(user: any): Promise<ServiceHistory[]> {
    if (user.role === Role.CUSTOMER) {
      return this.serviceModel
        .find({ userId: user.userId })
        .sort({ createdAt: -1 })
        .exec();
    }
    return this.serviceModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<ServiceHistory> {
    this.assertValidId(id);
    const record = await this.serviceModel.findById(id).exec();
    if (!record) {
      throw new NotFoundException('Service history record not found');
    }
    return record;
  }

  async update(
    id: string,
    updateDto: UpdateServiceHistoryDto,
  ): Promise<ServiceHistory> {
    this.assertValidId(id);
    const record = await this.serviceModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
    if (!record) {
      throw new NotFoundException('Service history record not found');
    }
    await this.notifyOwner(
      record,
      'A service record in your history was updated.',
    );
    return record;
  }

  async remove(id: string): Promise<{ message: string }> {
    this.assertValidId(id);
    const record = await this.serviceModel.findByIdAndDelete(id).exec();
    if (!record) {
      throw new NotFoundException('Service history record not found');
    }
    await this.notifyOwner(
      record,
      'A service record was deleted from your history.',
    );
    return { message: 'Service history record deleted successfully' };
  }
}

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import {
  Notification,
  NotificationCategory,
  NotificationDocument,
} from './notification.schema';
import { CreateNotificationDto } from './dto/notification.dto';

// Sender ke sirf ye fields wapas bhejte hain (password wagera kabhi nahi)
const SENDER_FIELDS = 'username name avatar';

interface NotifyParams {
  recipientId: string;
  senderId?: string;
  text: string;
  highlightText?: string;
  category: NotificationCategory;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly model: Model<NotificationDocument>,
  ) {}

  private assertId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid notification id');
    }
  }

  // ---------------------------------------------------------------
  // Dusre modules (vehicles, expense, service, chat) YE use karenge.
  // Agar notification banne mein koi error aaye to asli kaam
  // (jaise vehicle save hona) kabhi fail nahi hoga, sirf log likhega.
  // ---------------------------------------------------------------
  async notify(params: NotifyParams): Promise<void> {
    try {
      await this.model.create({
        recipient: params.recipientId,
        sender: params.senderId,
        type: 'info',
        category: params.category,
        text: params.text,
        highlightText: params.highlightText,
      });
    } catch (error) {
      this.logger.error(
        `Failed to create notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Chat ke liye: ek sender ki ek hi (latest) unread notification rahegi,
  // taake 20 messages par 20 notifications na ban jayen.
  async notifyNewMessage(
    senderId: string,
    receiverId: string,
    preview: string,
  ): Promise<void> {
    try {
      await this.model.deleteMany({
        recipient: receiverId,
        sender: senderId,
        category: 'message',
        isRead: false,
      });
      await this.model.create({
        recipient: receiverId,
        sender: senderId,
        type: 'info',
        category: 'message',
        text: 'sent you a message:',
        highlightText: preview,
      });
    } catch (error) {
      this.logger.error(
        `Failed to create message notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Swagger se testing wali create (controller yahi use karta hai)
  async create(senderId: string | undefined, dto: CreateNotificationDto) {
    const type = dto.type ?? 'info';
    if (type === 'action' && !dto.actionType) {
      throw new BadRequestException('actionType is required for action notifications');
    }

    return this.model.create({
      recipient: dto.recipientId ?? senderId,
      sender: senderId,
      type,
      category: dto.actionType === 'payment' ? 'payment' : 'general',
      text: dto.text,
      highlightText: dto.highlightText,
      actionType: type === 'action' ? dto.actionType : undefined,
      actionStatus: type === 'action' ? 'pending' : undefined,
    });
  }

  async findForUser(userId: string, limit: number) {
    const [notifications, total, unreadCount] = await Promise.all([
      this.model
        .find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('sender', SENDER_FIELDS)
        .lean(),
      this.model.countDocuments({ recipient: userId }),
      this.model.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return { notifications, total, unreadCount };
  }

  async unreadCount(userId: string) {
    const unreadCount = await this.model.countDocuments({
      recipient: userId,
      isRead: false,
    });
    return { unreadCount };
  }

  async markRead(userId: string, id: string) {
    this.assertId(id);
    const updated = await this.model.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Notification not found');
    return updated;
  }

  async markAllRead(userId: string) {
    const result = await this.model.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true },
    );
    return { updated: result.modifiedCount };
  }

  async remove(userId: string, id: string) {
    this.assertId(id);
    // Sirf apni notification delete ho sakti hai (recipient check)
    const deleted = await this.model.findOneAndDelete({
      _id: id,
      recipient: userId,
    });
    if (!deleted) throw new NotFoundException('Notification not found');
    return { message: 'Notification deleted successfully' };
  }

  async performAction(userId: string, id: string, action: 'pay' | 'skip') {
    this.assertId(id);
    const notification = await this.model.findOne({
      _id: id,
      recipient: userId,
    });
    if (!notification) throw new NotFoundException('Notification not found');

    if (notification.type !== 'action' || notification.actionStatus !== 'pending') {
      throw new BadRequestException('No pending action on this notification');
    }

    // NOTE: abhi sirf status badalta hai. Asli payment baad mein yahin jodni hai.
    notification.actionStatus = action === 'pay' ? 'paid' : 'skipped';
    notification.isRead = true;
    await notification.save();
    return notification;
  }
}

import { createHash } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, isValidObjectId, Model, Types } from 'mongoose';
import { roleFilter, ACTIVE_FILTER } from '../admin-users/admin-users.service';
import { Notification } from '../notifications/notification.schema';
import type { NotificationDocument } from '../notifications/notification.schema';
import { escapeRegex, parsePaging } from '../workshops/workshops.service';
import { AdminNotification } from './admin-notification.schema';
import type {
  AdminNotificationDocument,
  NotificationAudience,
} from './admin-notification.schema';
import {
  ListAdminNotificationsQueryDto,
  SendNotificationDto,
} from './dto/admin-notification.dto';

// Server (EC2) chhota hai, isliye ek baar mein itne hi users tak
const MAX_RECIPIENTS = 5000;
const BATCH_SIZE = 500;
// Is muddat mein bilkul wohi notification dobara nahi ja sakti
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

const SENDER_FIELDS = 'username firstName lastName email';
const RECIPIENT_FIELDS = 'username firstName lastName email role';

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: number }).code === 11000
  );
}

@Injectable()
export class AdminNotificationsService {
  private readonly logger = new Logger(AdminNotificationsService.name);

  constructor(
    @InjectModel(AdminNotification.name)
    private readonly model: Model<AdminNotificationDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private get userModel() {
    return this.connection.model('User');
  }

  private assertId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid notification id');
    }
  }

  private audienceFilter(
    audience: NotificationAudience,
    selectedIds: string[] = [],
  ): Record<string, unknown> {
    // Deactivated users ko kabhi nahi bhejte
    const base: Record<string, unknown> = { ...ACTIVE_FILTER };
    if (audience === 'selected') {
      base._id = { $in: selectedIds };
    } else if (audience === 'customers') {
      Object.assign(base, roleFilter('customer'));
    } else if (audience === 'workshop_staff') {
      Object.assign(base, roleFilter('workshop_staff'));
    } else if (audience === 'admins') {
      Object.assign(base, roleFilter('admin'));
    }
    return base;
  }

  // "Is audience mein kitne log hain" (form mein dikhane ke liye)
  async audienceCount(
    audience: Exclude<NotificationAudience, 'selected'>,
  ): Promise<{ audience: string; count: number }> {
    const count = await this.userModel.countDocuments(
      this.audienceFilter(audience),
    );
    return { audience, count };
  }

  private async resolveRecipients(
    audience: NotificationAudience,
    selectedIds: string[],
  ): Promise<string[]> {
    const users = await this.userModel
      .find(this.audienceFilter(audience, selectedIds))
      .select('_id')
      .limit(MAX_RECIPIENTS + 1)
      .lean<{ _id: Types.ObjectId }[]>()
      .exec();
    return users.map((user) => String(user._id));
  }

  // ---------------------------------------------------------------
  // SEND
  // ---------------------------------------------------------------
  async send(
    adminId: string,
    dto: SendNotificationDto,
  ): Promise<Record<string, any>> {
    const title = dto.title.trim();
    const message = dto.message.trim();
    if (!title || !message) {
      throw new BadRequestException('Title and message cannot be empty');
    }

    const selectedIds =
      dto.audience === 'selected'
        ? Array.from(new Set(dto.recipientIds ?? []))
        : [];
    if (dto.audience === 'selected' && selectedIds.length === 0) {
      throw new BadRequestException(
        'Select at least one recipient when audience is "selected"',
      );
    }
    if (dto.audience !== 'selected' && dto.recipientIds?.length) {
      throw new BadRequestException(
        'recipientIds is only allowed when audience is "selected"',
      );
    }

    // --- Duplicate submission check ---
    const fingerprint = createHash('sha256')
      .update(
        JSON.stringify([
          adminId,
          title.toLowerCase(),
          message.toLowerCase(),
          dto.audience,
          [...selectedIds].sort(),
        ]),
      )
      .digest('hex');

    const recentDuplicate = await this.model.exists({
      sentBy: adminId,
      fingerprint,
      createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    });
    if (recentDuplicate) {
      throw new ConflictException(
        'This notification was already sent a few minutes ago. Change the title or message to send it again.',
      );
    }
    if (dto.idempotencyKey) {
      const sameForm = await this.model.exists({
        sentBy: adminId,
        idempotencyKey: dto.idempotencyKey,
      });
      if (sameForm) {
        throw new ConflictException('This notification was already submitted');
      }
    }

    // --- Recipients ---
    const recipientIds = await this.resolveRecipients(
      dto.audience,
      selectedIds,
    );
    if (recipientIds.length === 0) {
      throw new BadRequestException(
        'No active recipients found for this audience',
      );
    }
    if (recipientIds.length > MAX_RECIPIENTS) {
      throw new BadRequestException(
        `Too many recipients (limit ${MAX_RECIPIENTS}). Choose a smaller audience.`,
      );
    }

    // --- Record banao. Unique dedupeKey double-click wali race rokta hai ---
    const bucket = Math.floor(Date.now() / DUPLICATE_WINDOW_MS);
    let campaign: AdminNotificationDocument;
    try {
      campaign = await this.model.create({
        title,
        message,
        audience: dto.audience,
        selectedRecipients: selectedIds,
        recipientCount: recipientIds.length,
        status: 'sending',
        sentBy: adminId,
        fingerprint,
        dedupeKey: `${fingerprint}:${bucket}`,
        idempotencyKey: dto.idempotencyKey,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('This notification was already submitted');
      }
      throw error;
    }

    // --- Deliver: har user ke inbox mein notification ---
    let delivered = 0;
    for (let i = 0; i < recipientIds.length; i += BATCH_SIZE) {
      const chunk = recipientIds.slice(i, i + BATCH_SIZE);
      const docs: any[] = chunk.map((recipientId) => ({
        recipient: new Types.ObjectId(recipientId),
        sender: new Types.ObjectId(adminId),
        type: 'info',
        category: 'general',
        text: `${title}: ${message}`,
        campaign: campaign._id,
      }));
      try {
        const inserted = await this.notificationModel.insertMany(docs, {
          ordered: false,
        });
        delivered += inserted.length;
      } catch (error) {
        // Kuch documents save ho chuke ho sakte hain
        const partial =
          (error as any)?.result?.insertedCount ??
          (error as any)?.insertedDocs?.length ??
          0;
        delivered += partial;
        this.logger.error(
          `Notification batch failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const total = recipientIds.length;
    const status =
      delivered === total ? 'sent' : delivered === 0 ? 'failed' : 'partial';
    await this.model
      .updateOne(
        { _id: campaign._id },
        {
          $set: {
            deliveredCount: delivered,
            failedCount: total - delivered,
            status,
            sentAt: new Date(),
          },
        },
      )
      .exec();

    return this.findOne(String(campaign._id));
  }

  // ---------------------------------------------------------------
  // HISTORY
  // ---------------------------------------------------------------
  async findAll(
    query: ListAdminNotificationsQueryDto,
  ): Promise<Record<string, any>> {
    const { page, limit, skip } = parsePaging(query.page, query.limit);
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.audience) filter.audience = query.audience;
    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search.trim()), 'i');
      filter.$or = [{ title: rx }, { message: rx }];
    }

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .select('-selectedRecipients -fingerprint -dedupeKey -idempotencyKey')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sentBy', SENDER_FIELDS)
        .lean<Record<string, any>[]>()
        .exec(),
      this.model.countDocuments(filter),
    ]);

    const readCounts = await this.readCounts(items.map((item) => item._id));
    return {
      items: items.map((item) => ({
        ...item,
        readCount: readCounts.get(String(item._id)) ?? 0,
      })),
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    };
  }

  // Kitne users ne notification padh li
  private async readCounts(campaignIds: Types.ObjectId[]) {
    const map = new Map<string, number>();
    if (campaignIds.length === 0) return map;
    const rows = await this.notificationModel.aggregate<{
      _id: Types.ObjectId;
      read: number;
    }>([
      { $match: { campaign: { $in: campaignIds } } },
      {
        $group: {
          _id: '$campaign',
          read: { $sum: { $cond: ['$isRead', 1, 0] } },
        },
      },
    ]);
    rows.forEach((row) => map.set(String(row._id), row.read));
    return map;
  }

  async findOne(id: string): Promise<Record<string, any>> {
    this.assertId(id);
    const campaign = await this.model
      .findById(id)
      .select('-fingerprint -dedupeKey -idempotencyKey')
      .populate('sentBy', SENDER_FIELDS)
      .lean<Record<string, any>>()
      .exec();
    if (!campaign) throw new NotFoundException('Notification not found');

    const [readMap, deliveries] = await Promise.all([
      this.readCounts([campaign._id]),
      // Har recipient ka delivery status (pehle 200)
      this.notificationModel
        .find({ campaign: campaign._id })
        .select('recipient isRead createdAt')
        .sort({ createdAt: 1 })
        .limit(200)
        .populate('recipient', RECIPIENT_FIELDS)
        .lean<Record<string, any>[]>()
        .exec(),
    ]);

    return {
      ...campaign,
      readCount: readMap.get(String(campaign._id)) ?? 0,
      deliveries: deliveries.map((delivery) => ({
        recipient: delivery.recipient,
        status: delivery.isRead ? 'read' : 'delivered',
        deliveredAt: delivery.createdAt,
      })),
    };
  }
}

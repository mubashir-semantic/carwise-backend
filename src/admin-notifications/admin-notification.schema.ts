import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminNotificationDocument = AdminNotification & Document;

// Kisko bhejni hai
export const NOTIFICATION_AUDIENCES = [
  'all',
  'customers',
  'workshop_staff',
  'admins',
  'selected',
] as const;
export type NotificationAudience = (typeof NOTIFICATION_AUDIENCES)[number];

// Delivery status
//   sending : bhej rahe hain
//   sent    : sab ko pahunch gayi
//   partial : kuch ko pahunchi, kuch ko nahi
//   failed  : kisi ko nahi pahunchi
export const CAMPAIGN_STATUSES = ['sending', 'sent', 'partial', 'failed'] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

// Admin ki bheji hui ek notification ka record (history).
// Har recipient ko alag Notification document milta hai (campaign field se juda).
@Schema({ timestamps: true })
export class AdminNotification {
  @Prop({ type: String, required: true, trim: true, maxlength: 100 })
  title: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 500 })
  message: string;

  @Prop({ type: String, enum: NOTIFICATION_AUDIENCES, required: true })
  audience: string;

  // Sirf audience "selected" ho to: admin ne jin users ko chuna
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  selectedRecipients: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  recipientCount: number;

  @Prop({ type: Number, default: 0 })
  deliveredCount: number;

  @Prop({ type: Number, default: 0 })
  failedCount: number;

  @Prop({ type: String, enum: CAMPAIGN_STATUSES, default: 'sending' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  sentBy: Types.ObjectId;

  @Prop({ type: Date })
  sentAt?: Date;

  // --- Duplicate submission se bachao ---
  // Same admin + same title/message/audience ka hash
  @Prop({ type: String, index: true })
  fingerprint: string;

  // fingerprint + 5 minute ka time bucket. Unique hai, isliye do requests
  // ek saath aayen (double click) to database ek ko reject kar deta hai.
  @Prop({ type: String, unique: true, sparse: true })
  dedupeKey?: string;

  // Frontend har form ke liye ek key bhejta hai. Wohi key dobara aaye to reject.
  @Prop({ type: String })
  idempotencyKey?: string;
}

export const AdminNotificationSchema =
  SchemaFactory.createForClass(AdminNotification);

AdminNotificationSchema.index({ createdAt: -1 });
AdminNotificationSchema.index(
  { sentBy: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
);

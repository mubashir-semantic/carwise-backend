import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

// Notification kis cheez se bani (grouping / icon ke liye)
export const NOTIFICATION_CATEGORIES = [
  'general',
  'message',
  'vehicle',
  'expense',
  'service',
  'payment',
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

@Schema({ timestamps: true })
export class Notification {
  // Jis user ko notification milni hai
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  recipient: Types.ObjectId;

  // Jis ne bheji (optional: system notification mein khali)
  @Prop({ type: Types.ObjectId, ref: 'User' })
  sender?: Types.ObjectId;

  // 'info' = sirf message, 'action' = Pay / Skip buttons wali
  @Prop({ type: String, enum: ['info', 'action'], default: 'info' })
  type: string;

  @Prop({ type: String, enum: NOTIFICATION_CATEGORIES, default: 'general' })
  category: string;

  @Prop({ type: String, required: true })
  text: string;

  // Bold dikhane wala hissa (jaise report ka naam)
  @Prop({ type: String })
  highlightText?: string;

  // Sirf action notification ke liye
  @Prop({ type: String, enum: ['payment'] })
  actionType?: string;

  @Prop({ type: String, enum: ['pending', 'paid', 'skipped'] })
  actionStatus?: string;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Latest pehle wali list ko tez karne ke liye
NotificationSchema.index({ recipient: 1, createdAt: -1 });

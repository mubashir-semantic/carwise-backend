import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const SERVICE_TYPES = ['workshop', 'pickup_delivery'] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export type BookingDocument = Booking & Document;

@Schema({ _id: false })
export class StatusHistoryEntry {
  @Prop({ type: String, enum: BOOKING_STATUSES, required: true })
  status: BookingStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  changedBy?: Types.ObjectId;

  @Prop({ type: Date, default: () => new Date() })
  at: Date;

  @Prop({ type: String })
  note?: string;
}
const StatusHistoryEntrySchema = SchemaFactory.createForClass(StatusHistoryEntry);

@Schema({ timestamps: true })
export class Booking {
  // Insaani padhne wala reference, jaise BK-20261014-A1B2C3
  @Prop({ type: String, required: true, unique: true })
  reference: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  customer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Workshop', required: true, index: true })
  workshop: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vehicle' })
  vehicle?: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  services: string[];

  @Prop({ type: Date, required: true })
  bookingDate: Date;

  @Prop({ type: String })
  timeSlot?: string;

  // 'workshop' = customer khud workshop aayega, 'pickup_delivery' = gaari uthayi/wapis di jayegi
  @Prop({ type: String, enum: SERVICE_TYPES, default: 'workshop' })
  serviceType: ServiceType;

  @Prop({ type: String })
  pickupAddress?: string;

  @Prop({ type: String })
  deliveryAddress?: string;

  @Prop({ type: String })
  instructions?: string;

  @Prop({ type: String, enum: BOOKING_STATUSES, default: 'pending' })
  status: BookingStatus;

  @Prop({ type: String })
  cancellationReason?: string;

  @Prop({ type: [StatusHistoryEntrySchema], default: [] })
  statusHistory: StatusHistoryEntry[];
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index({ workshop: 1, status: 1, createdAt: -1 });
BookingSchema.index({ customer: 1, createdAt: -1 });

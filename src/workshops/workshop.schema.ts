import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export const WORKSHOP_STATUSES = ['active', 'inactive', 'pending'] as const;
export type WorkshopStatus = (typeof WORKSHOP_STATUSES)[number];

export type WorkshopDocument = Workshop & Document;

@Schema({ timestamps: true })
export class Workshop {
  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: String, trim: true })
  phone?: string;

  @Prop({ type: String, trim: true, lowercase: true })
  email?: string;

  @Prop({ type: String, trim: true })
  address?: string;

  @Prop({ type: String, trim: true })
  city?: string;

  // Map par dikhane ke liye (optional). Admin / staff set karte hain.
  @Prop({ type: Number, min: -90, max: 90 })
  latitude?: number;

  @Prop({ type: Number, min: -180, max: 180 })
  longitude?: number;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [String], default: [] })
  services: string[];

  @Prop({ type: String, enum: WORKSHOP_STATUSES, default: 'active' })
  status: WorkshopStatus;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  staff: Types.ObjectId[];
}

export const WorkshopSchema = SchemaFactory.createForClass(Workshop);

WorkshopSchema.index({ status: 1, createdAt: -1 });
WorkshopSchema.index({ staff: 1 });

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

  @Prop({ type: [String], default: [] })
  images: string[];

  // Workshop jo services deta hai (jaise "Oil Change", "Tyre Rotation")
  @Prop({ type: [String], default: [] })
  services: string[];

  @Prop({ type: String, enum: WORKSHOP_STATUSES, default: 'active' })
  status: WorkshopStatus;

  // Is workshop ka staff. User schema ko chhedne ki zaroorat nahi padti:
  // "mera workshop" = wo workshop jiske staff mein mera id ho.
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  staff: Types.ObjectId[];
}

export const WorkshopSchema = SchemaFactory.createForClass(Workshop);

WorkshopSchema.index({ status: 1, createdAt: -1 });
WorkshopSchema.index({ staff: 1 });

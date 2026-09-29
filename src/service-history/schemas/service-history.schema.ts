import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ServiceHistory extends Document {
  @Prop({ required: true })
  title: string; // e.g., "Car Oil Repair"

  @Prop({ required: true })
  serviceCenter: string; // e.g., "Bildialog Asane"

  @Prop({ required: true })
  cost: number; // e.g., 5000

  @Prop({ required: true })
  serviceDate: string; // e.g., "11.02.2022"

  @Prop({ default: 'Ongoing' })
  status: string; // e.g., "Ongoing" or "Completed"
}

export const ServiceHistorySchema =
  SchemaFactory.createForClass(ServiceHistory);

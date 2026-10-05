import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Vehicle extends Document {
  // User ke sath link karne ke liye userId add kiya gaya hai
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  licenseNumber: string;

  @Prop({ default: true })
  isVerified: boolean;

  @Prop({ default: 'Mercedez S-Benz' })
  carName: string;

  @Prop({ default: '2018' })
  modelYear: string;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);

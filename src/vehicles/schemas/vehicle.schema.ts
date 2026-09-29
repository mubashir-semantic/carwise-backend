import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Vehicle extends Document {
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

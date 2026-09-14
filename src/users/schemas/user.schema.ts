import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: false })
  mobile: string;

  @Prop({ default: 'user' })
  role: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ required: false })
  otp: string;

  @Prop({ required: false })
  otpExpires: Date;

  @Prop({ default: 0 })
  otpResendAttempts: number;

  @Prop({ default: 0 })
  otpInvalidAttempts: number;

  @Prop({ required: false })
  otpLockoutUntil: Date;

  @Prop({ required: false })
  refreshToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
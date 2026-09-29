import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ExpenseHistory extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  cost: number;

  @Prop({ required: true })
  servicingDetails: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  expenseDate: string;

  @Prop({ default: 'Completed' })
  status: string;
}

export const ExpenseHistorySchema =
  SchemaFactory.createForClass(ExpenseHistory);

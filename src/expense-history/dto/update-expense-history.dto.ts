import { PartialType } from '@nestjs/swagger';
import { CreateExpenseHistoryDto } from './create-expense-history.dto';

export class UpdateExpenseHistoryDto extends PartialType(
  CreateExpenseHistoryDto,
) {}
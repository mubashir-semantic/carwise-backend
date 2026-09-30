import { PartialType } from '@nestjs/swagger';
import { CreateServiceHistoryDto } from './create-service-history.dto';

export class UpdateServiceHistoryDto extends PartialType(
  CreateServiceHistoryDto,
) {}
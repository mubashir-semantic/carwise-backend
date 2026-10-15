import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  CAMPAIGN_STATUSES,
  NOTIFICATION_AUDIENCES,
} from '../admin-notification.schema';
import type { NotificationAudience } from '../admin-notification.schema';

export class SendNotificationDto {
  @ApiProperty({ example: 'Holiday notice' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ example: 'All workshops will be closed on Friday.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message: string;

  @ApiProperty({
    enum: NOTIFICATION_AUDIENCES,
    description:
      'all = sab active users, customers / workshop_staff / admins = us role ke users, selected = recipientIds wale',
  })
  @IsIn(NOTIFICATION_AUDIENCES)
  audience: NotificationAudience;

  @ApiPropertyOptional({
    type: [String],
    description: 'Sirf audience "selected" ke liye (max 500 users)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsMongoId({ each: true })
  recipientIds?: string[];

  @ApiPropertyOptional({
    example: '0b7c0f9e-5d1e-4d57-9a3c-0c2f8a1e1111',
    description:
      'Form ke liye random key. Wohi key dobara bheji jaye to request reject hoti hai (double submit se bachao)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  idempotencyKey?: string;
}

export class ListAdminNotificationsQueryDto {
  @ApiPropertyOptional({ description: 'Title / message mein search' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CAMPAIGN_STATUSES })
  @IsOptional()
  @IsIn(CAMPAIGN_STATUSES)
  status?: (typeof CAMPAIGN_STATUSES)[number];

  @ApiPropertyOptional({ enum: NOTIFICATION_AUDIENCES })
  @IsOptional()
  @IsIn(NOTIFICATION_AUDIENCES)
  audience?: NotificationAudience;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @IsString()
  limit?: string;
}

export class AudienceCountQueryDto {
  @ApiProperty({ enum: ['all', 'customers', 'workshop_staff', 'admins'] })
  @IsIn(['all', 'customers', 'workshop_staff', 'admins'])
  audience: Exclude<NotificationAudience, 'selected'>;
}

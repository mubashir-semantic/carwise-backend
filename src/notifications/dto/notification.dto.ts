import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateNotificationDto {
  @ApiPropertyOptional({
    example: '665f1c2e8b3a4d0012345678',
    description:
      'The user ID of the recipient. Leave empty to send to yourself (for testing purposes).',
  })
  @IsOptional()
  @IsMongoId()
  recipientId?: string;

  @ApiProperty({
    example: 'asked for payment. Would you like to pay to him now or skip?',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  text: string;

  @ApiPropertyOptional({ example: 'Isla Nublar SOC2 compliance report' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  highlightText?: string;

  @ApiPropertyOptional({ enum: ['info', 'action'], example: 'info' })
  @IsOptional()
  @IsIn(['info', 'action'])
  type?: 'info' | 'action';

  @ApiPropertyOptional({
    enum: ['payment'],
    description: 'Required if the type is "action".',
  })
  @IsOptional()
  @IsIn(['payment'])
  actionType?: 'payment';
}

export class NotificationActionDto {
  @ApiProperty({ enum: ['pay', 'skip'], example: 'pay' })
  @IsIn(['pay', 'skip'])
  action: 'pay' | 'skip';
}

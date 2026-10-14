import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { BOOKING_STATUSES, SERVICE_TYPES } from '../booking.schema';
import type { BookingStatus, ServiceType } from '../booking.schema';

export class CreateBookingDto {
  @ApiProperty({ example: '66f9a1b2c3d4e5f6a7b8c9d0', description: 'Workshop id' })
  @IsMongoId()
  workshopId: string;

  @ApiPropertyOptional({ example: '66f9a1b2c3d4e5f6a7b8c9d1', description: 'Vehicle id' })
  @IsOptional()
  @IsMongoId()
  vehicleId?: string;

  @ApiProperty({ type: [String], example: ['Oil Change', 'Car Wash'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  services: string[];

  @ApiProperty({ example: '2026-10-20' })
  @IsDateString()
  bookingDate: string;

  @ApiPropertyOptional({ example: '10:00 AM - 11:00 AM' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  timeSlot?: string;

  @ApiPropertyOptional({ enum: SERVICE_TYPES, default: 'workshop' })
  @IsOptional()
  @IsIn(SERVICE_TYPES)
  serviceType?: ServiceType;

  @ApiPropertyOptional({ example: 'House 5, Street 3, DHA' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  pickupAddress?: string;

  @ApiPropertyOptional({ example: 'House 5, Street 3, DHA' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  deliveryAddress?: string;

  @ApiPropertyOptional({ example: 'Please check the brakes too' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;
}

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BOOKING_STATUSES })
  @IsIn(BOOKING_STATUSES)
  status: BookingStatus;

  @ApiPropertyOptional({ description: 'Optional note / cancellation reason' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ListBookingsQueryDto {
  @ApiPropertyOptional({ enum: BOOKING_STATUSES })
  @IsOptional()
  @IsIn(BOOKING_STATUSES)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Workshop id (Admin filter)' })
  @IsOptional()
  @IsMongoId()
  workshopId?: string;

  @ApiPropertyOptional({ description: 'Reference ya customer name/email/mobile' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '2026-10-01', description: 'Booking date from' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-31', description: 'Booking date to' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @IsString()
  limit?: string;
}

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { WORKSHOP_STATUSES } from '../workshop.schema';
import type { WorkshopStatus } from '../workshop.schema';

export class CreateWorkshopDto {
  @ApiProperty({ example: 'Speed Auto Care' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'Full service car workshop' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: '+92 300 1234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'info@speedauto.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Shop 12, Main Boulevard' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional({ example: 'Lahore' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ example: 31.5204, description: 'Latitude (-90 to 90)' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 74.3587, description: 'Longitude (-180 to 180)' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ type: [String], description: 'Image URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Oil Change', 'Car Wash'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ApiPropertyOptional({ enum: WORKSHOP_STATUSES, default: 'active' })
  @IsOptional()
  @IsIn(WORKSHOP_STATUSES)
  status?: WorkshopStatus;
}

// Update: sab fields optional. Workshop Staff status nahi badal sakta
// (service us field ko khud ignore kar deti hai).
export class UpdateWorkshopDto extends PartialType(CreateWorkshopDto) {}

export class UpdateWorkshopStatusDto {
  @ApiProperty({ enum: WORKSHOP_STATUSES })
  @IsIn(WORKSHOP_STATUSES)
  status: WorkshopStatus;
}

export class AssignStaffDto {
  @ApiProperty({ example: '66f9a1b2c3d4e5f6a7b8c9d0', description: 'User id' })
  @IsMongoId()
  userId: string;
}

// Page/limit URL se string ban kar aate hain, service unhe number banati hai
export class ListWorkshopsQueryDto {
  @ApiPropertyOptional({ description: 'Name / city / address mein search' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: WORKSHOP_STATUSES })
  @IsOptional()
  @IsIn(WORKSHOP_STATUSES)
  status?: WorkshopStatus;

  @ApiPropertyOptional({ example: 'Lahore' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @IsString()
  limit?: string;
}

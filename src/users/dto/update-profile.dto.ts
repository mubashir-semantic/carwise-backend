import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Muhammad Mubashir',
    description: 'User full name / username',
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({
    example: 'Muhammad',
    description: 'User first name',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Mubashir',
    description: 'User last name',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    example: '03001234567',
    description: 'User mobile number',
  })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional({
    example: 'Model Town, Rahim Yar Khan',
    description: 'User home address',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: 'https://ui-avatars.com/api/?name=User',
    description: 'User avatar URL or base64 string',
  })
  @IsString()
  @IsOptional()
  avatar?: string;
}

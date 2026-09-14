import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Muhammad Mubashir',
    description: 'User full name',
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({
    example: '03001234567',
    description: 'User mobile number',
  })
  @IsString()
  @IsOptional()
  mobile?: string;
}

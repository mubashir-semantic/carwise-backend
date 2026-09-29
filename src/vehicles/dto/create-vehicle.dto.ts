import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC-1234' })
  @IsNotEmpty({ message: 'License number is required' })
  @IsString()
  @MinLength(3)
  licenseNumber: string;

  @ApiProperty({ example: 'Toyota Corolla' })
  @IsOptional()
  @IsString()
  carName?: string;

  @ApiProperty({ example: '2022' })
  @IsOptional()
  @IsString()
  modelYear?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateServiceHistoryDto {
  @ApiProperty({
    example: 'Car Oil Repair',
    description: 'Title or description of the service',
  })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Bildialog Asane',
    description: 'Name of the service center',
  })
  @IsNotEmpty({ message: 'Service center name is required' })
  @IsString()
  serviceCenter: string;

  @ApiProperty({ example: 4500, description: 'Cost of the service' })
  @IsNotEmpty({ message: 'Cost is required' })
  @IsNumber()
  cost: number;

  @ApiProperty({ example: '11.02.2022', description: 'Date of service' })
  @IsNotEmpty({ message: 'Service date is required' })
  @IsString()
  serviceDate: string;

  @ApiProperty({ example: 'Ongoing', description: 'Current status of service' })
  @IsString()
  status?: string;
}

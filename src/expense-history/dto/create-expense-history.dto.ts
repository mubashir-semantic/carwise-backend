import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateExpenseHistoryDto {
  @ApiProperty({
    example: 'Car Repair & Maintenance',
    description: 'Title of the expense',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 3500, description: 'Cost of the expense' })
  @IsNotEmpty()
  @IsNumber()
  cost: number;

  @ApiProperty({
    example: 'Changed engine oil and filters',
    description: 'Servicing or expense details',
  })
  @IsNotEmpty()
  @IsString()
  servicingDetails: string;

  @ApiProperty({ example: 'Oil Change', description: 'Category of expense' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ example: '16.09.2026', description: 'Date of expense' })
  @IsNotEmpty()
  @IsString()
  expenseDate: string;

  @ApiProperty({ example: 'Completed', description: 'Status of expense' })
  @IsString()
  status?: string;
}

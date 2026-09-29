import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExpenseHistoryService } from './expense-history.service';
import { CreateExpenseHistoryDto } from './dto/create-expense-history.dto';

@ApiTags('Expense History')
@Controller('expense-history')
export class ExpenseHistoryController {
  constructor(private readonly expenseHistoryService: ExpenseHistoryService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new expense history record' })
  @ApiResponse({ status: 201, description: 'Expense record successfully created.' })
  async create(@Body() createDto: CreateExpenseHistoryDto) {
    return this.expenseHistoryService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all expense history records' })
  @ApiResponse({ status: 200, description: 'Returns a list of expense histories.' })
  async findAll() {
    return this.expenseHistoryService.findAll();
  }
}
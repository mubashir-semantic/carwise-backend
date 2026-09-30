import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ExpenseHistoryService } from './expense-history.service';
import { CreateExpenseHistoryDto } from './dto/create-expense-history.dto';
import { UpdateExpenseHistoryDto } from './dto/update-expense-history.dto';

@ApiTags('Expense History')
@Controller('expense-history')
export class ExpenseHistoryController {
  constructor(private readonly expenseHistoryService: ExpenseHistoryService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new expense history record' })
  @ApiResponse({
    status: 201,
    description: 'Expense record successfully created.',
  })
  async create(@Body() createDto: CreateExpenseHistoryDto) {
    return this.expenseHistoryService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all expense history records' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of expense histories.',
  })
  async findAll() {
    return this.expenseHistoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single expense history record by id' })
  @ApiParam({
    name: 'id',
    description: 'Expense history id',
    example: '66f9a1b2c3d4e5f6a7b8c9d0',
  })
  @ApiResponse({ status: 200, description: 'Returns the expense record.' })
  @ApiResponse({ status: 400, description: 'Invalid expense history id.' })
  @ApiResponse({ status: 404, description: 'Expense record not found.' })
  async findOne(@Param('id') id: string) {
    return this.expenseHistoryService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an expense history record' })
  @ApiParam({
    name: 'id',
    description: 'Expense history id',
    example: '66f9a1b2c3d4e5f6a7b8c9d0',
  })
  @ApiResponse({
    status: 200,
    description: 'Expense record updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid expense history id.' })
  @ApiResponse({ status: 404, description: 'Expense record not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateExpenseHistoryDto,
  ) {
    return this.expenseHistoryService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expense history record' })
  @ApiParam({
    name: 'id',
    description: 'Expense history id',
    example: '66f9a1b2c3d4e5f6a7b8c9d0',
  })
  @ApiResponse({
    status: 200,
    description: 'Expense record deleted successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid expense history id.' })
  @ApiResponse({ status: 404, description: 'Expense record not found.' })
  async remove(@Param('id') id: string) {
    return this.expenseHistoryService.remove(id);
  }
}

import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServiceHistoryService } from './service-history.service';
import { CreateServiceHistoryDto } from './dto/create-service-history.dto';

@ApiTags('Service History')
@Controller('service-history')
export class ServiceHistoryController {
  constructor(private readonly serviceHistoryService: ServiceHistoryService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new service history record' })
  @ApiResponse({
    status: 201,
    description: 'Service record successfully created.',
  })
  async create(@Body() createDto: CreateServiceHistoryDto) {
    return this.serviceHistoryService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all service history records' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of service histories.',
  })
  async findAll() {
    return this.serviceHistoryService.findAll();
  }
}

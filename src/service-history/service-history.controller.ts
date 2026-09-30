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
import { ServiceHistoryService } from './service-history.service';
import { CreateServiceHistoryDto } from './dto/create-service-history.dto';
import { UpdateServiceHistoryDto } from './dto/update-service-history.dto';

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

  @Get(':id')
  @ApiOperation({ summary: 'Get a single service history record by id' })
  @ApiParam({
    name: 'id',
    description: 'Service history id',
    example: '66f9a1b2c3d4e5f6a7b8c9d0',
  })
  @ApiResponse({ status: 200, description: 'Returns the service record.' })
  @ApiResponse({ status: 400, description: 'Invalid service history id.' })
  @ApiResponse({ status: 404, description: 'Service record not found.' })
  async findOne(@Param('id') id: string) {
    return this.serviceHistoryService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a service history record' })
  @ApiParam({
    name: 'id',
    description: 'Service history id',
    example: '66f9a1b2c3d4e5f6a7b8c9d0',
  })
  @ApiResponse({
    status: 200,
    description: 'Service record updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid service history id.' })
  @ApiResponse({ status: 404, description: 'Service record not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateServiceHistoryDto,
  ) {
    return this.serviceHistoryService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service history record' })
  @ApiParam({
    name: 'id',
    description: 'Service history id',
    example: '66f9a1b2c3d4e5f6a7b8c9d0',
  })
  @ApiResponse({
    status: 200,
    description: 'Service record deleted successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid service history id.' })
  @ApiResponse({ status: 404, description: 'Service record not found.' })
  async remove(@Param('id') id: string) {
    return this.serviceHistoryService.remove(id);
  }
}

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new vehicle via license number' })
  @ApiResponse({ status: 201, description: 'Vehicle successfully added.' })
  async createVehicle(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all added vehicles' })
  @ApiResponse({ status: 200, description: 'Returns a list of vehicles.' })
  async getAllVehicles() {
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single vehicle by id' })
  @ApiParam({
    name: 'id',
    description: 'Vehicle id',
    example: '66f9a1b2c3d4e5f6a7b8c9d0',
  })
  @ApiResponse({ status: 200, description: 'Returns the vehicle.' })
  @ApiResponse({ status: 400, description: 'Invalid vehicle id.' })
  @ApiResponse({ status: 404, description: 'Vehicle not found.' })
  async getVehicle(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a vehicle' })
  @ApiParam({
    name: 'id',
    description: 'Vehicle id',
    example: '66f9a1b2c3d4e5f6a7b8c9d0',
  })
  @ApiResponse({ status: 200, description: 'Vehicle updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid vehicle id.' })
  @ApiResponse({ status: 404, description: 'Vehicle not found.' })
  async updateVehicle(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a vehicle' })
  @ApiParam({
    name: 'id',
    description: 'Vehicle id',
    example: '66f9a1b2c3d4e5f6a7b8c9d0',
  })
  @ApiResponse({ status: 200, description: 'Vehicle deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid vehicle id.' })
  @ApiResponse({ status: 404, description: 'Vehicle not found.' })
  async deleteVehicle(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}

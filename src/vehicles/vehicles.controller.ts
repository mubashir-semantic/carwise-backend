import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

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

  // Naya Route: GET /vehicles
  @Get()
  @ApiOperation({ summary: 'Get all added vehicles' })
  @ApiResponse({ status: 200, description: 'Returns a list of vehicles.' })
  async getAllVehicles() {
    return this.vehiclesService.findAll();
  }
}

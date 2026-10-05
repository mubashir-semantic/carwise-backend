import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@ApiTags('Vehicles')
@ApiBearerAuth() // Swagger UI mein token add karne ka option enable karega
@UseGuards(AuthGuard('jwt'), RolesGuard) // Controller level par JWT aur Roles guard apply ho gaya
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(Role.CUSTOMER, Role.ADMIN) // Sirf Customer aur Admin nayi gaari add kar sakte hain
  @ApiOperation({ summary: 'Add a new vehicle via license number' })
  @ApiResponse({ status: 201, description: 'Vehicle successfully added.' })
  async createVehicle(
    @Body() createVehicleDto: CreateVehicleDto,
    @Request() req: any, // Logged-in user ka data get karne ke liye
  ) {
    // req.user.userId ko service mein bhej kar vehicle ko is user se link kiya ja sakta hai
    return this.vehiclesService.create(createVehicleDto, req.user.userId);
  }

  @Get()
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.WORKSHOP_STAFF) // Sabhi roles access kar sakte hain
  @ApiOperation({ summary: 'Get all added vehicles' })
  @ApiResponse({ status: 200, description: 'Returns a list of vehicles.' })
  async getAllVehicles(@Request() req: any) {
    // req.user.role check kar ke Customer ko sirf uski apni gaariyan dikhai ja sakti hain
    return this.vehiclesService.findAll(req.user);
  }

  @Get(':id')
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.WORKSHOP_STAFF)
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
  @Roles(Role.CUSTOMER, Role.ADMIN)
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
  @Roles(Role.CUSTOMER, Role.ADMIN)
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

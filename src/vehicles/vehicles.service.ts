import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Vehicle } from './schemas/vehicle.schema';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<Vehicle>,
  ) {}

  // Galat id par 500 ki jagah 400 dene ke liye
  private assertValidId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid vehicle id');
    }
  }

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    const newVehicle = new this.vehicleModel(createVehicleDto);
    return newVehicle.save();
  }

  async findAll(): Promise<Vehicle[]> {
    // Jab auth link hoga, toh yahan find({ userId }) lagayenge.
    return this.vehicleModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Vehicle> {
    this.assertValidId(id);
    const vehicle = await this.vehicleModel.findById(id).exec();
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }

  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    this.assertValidId(id);
    const vehicle = await this.vehicleModel
      .findByIdAndUpdate(id, updateVehicleDto, { new: true })
      .exec();
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }

  async remove(id: string): Promise<{ message: string }> {
    this.assertValidId(id);
    const vehicle = await this.vehicleModel.findByIdAndDelete(id).exec();
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return { message: 'Vehicle deleted successfully' };
  }
}

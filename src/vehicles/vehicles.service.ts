import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vehicle } from './schemas/vehicle.schema';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<Vehicle>,
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    const newVehicle = new this.vehicleModel(createVehicleDto);
    return newVehicle.save();
  }

  // Naya function: Saari vehicles fetch karne ke liye
  async findAll(): Promise<Vehicle[]> {
    // Abhi hum saari gaariyan fetch kar rahe hain.
    // Jab auth link hoga, toh yahan find({ userId }) lagayenge.
    return this.vehicleModel.find().sort({ createdAt: -1 }).exec();
  }
}

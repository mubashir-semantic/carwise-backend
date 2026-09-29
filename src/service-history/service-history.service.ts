import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServiceHistory } from './schemas/service-history.schema';
import { CreateServiceHistoryDto } from './dto/create-service-history.dto';

@Injectable()
export class ServiceHistoryService {
  constructor(
    @InjectModel(ServiceHistory.name)
    private serviceModel: Model<ServiceHistory>,
  ) {}

  async create(createDto: CreateServiceHistoryDto): Promise<ServiceHistory> {
    const newService = new this.serviceModel(createDto);
    return newService.save();
  }

  async findAll(): Promise<ServiceHistory[]> {
    return this.serviceModel.find().sort({ createdAt: -1 }).exec();
  }
}

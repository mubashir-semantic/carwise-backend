import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './schemas/message.schema';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async saveMessage(senderId: string, dto: SendMessageDto): Promise<Message> {
    const newMessage = new this.messageModel({
      senderId,
      receiverId: dto.receiverId,
      text: dto.text,
      status: 'sent', // By default status sent hoga
    });
    return newMessage.save();
  }

  async getChatHistory(user1Id: string, user2Id: string): Promise<Message[]> {
    return this.messageModel
      .find({
        $or: [
          { senderId: user1Id, receiverId: user2Id },
          { senderId: user2Id, receiverId: user1Id },
        ],
      })
      .sort({ createdAt: 1 }) // Purane messages pehle, naye baad mein
      .exec();
  }
}

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeUsers = new Map<string, string>();

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new UnauthorizedException('Authentication token missing');
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.userId;

      client.data.userId = userId;
      this.activeUsers.set(userId, client.id);

      console.log(`🟢 Client connected: ${client.id} (User ID: ${userId})`);

      // NAYA LOGIC: Jab bhi koi connect ho, toh sabhi clients ko online users ki updated list bhej do
      this.server.emit('getOnlineUsers', Array.from(this.activeUsers.keys()));
    } catch (error) {
      console.log(`🔴 Connection rejected: ${client.id} - Invalid Token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const disconnectedUserId = client.data.userId;

    if (disconnectedUserId) {
      this.activeUsers.delete(disconnectedUserId);
      console.log(
        `🔴 Client disconnected: ${client.id} (User ID: ${disconnectedUserId})`,
      );

      // NAYA LOGIC: Jab bhi koi disconnect ho, toh sabhi clients ko online users ki updated list bhej do
      this.server.emit('getOnlineUsers', Array.from(this.activeUsers.keys()));
    }
  }

  // Real-time Chat Logic
  @SubscribeMessage('sendMessage')
  async handleMessage(
    // UPDATE: Yahan data mein tempId?: string add kar diya hai
    @MessageBody()
    data: {
      receiverId: string;
      text?: string;
      image?: string;
      tempId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.userId;

    // 1. Database mein message aur image dono save karna
    const savedMessage = await this.chatService.saveMessage(senderId, {
      receiverId: data.receiverId,
      text: data.text || '',
      image: data.image,
    });

    console.log(
      'Message saved in DB via Socket:',
      savedMessage.text || '📷 Image Uploaded',
    );

    const receiverSocketId = this.activeUsers.get(data.receiverId);

    if (receiverSocketId) {
      // Receiver ko message bhejna
      this.server.to(receiverSocketId).emit('receiveMessage', savedMessage);

      // Sender ko delivery status aur tempId wapis bhejna
      this.server.to(client.id).emit('messageDelivered', {
        messageId: savedMessage._id,
        tempId: data.tempId, // <-- Yeh update kiya taake frontend pehchan sake
      });
    }
  }
}

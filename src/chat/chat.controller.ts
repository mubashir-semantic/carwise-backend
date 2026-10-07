import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a message to a user' })
  @ApiResponse({ status: 201, description: 'Message sent successfully.' })
  async sendMessage(@Body() dto: SendMessageDto, @Request() req: any) {
    return this.chatService.saveMessage(req.user.userId, dto);
  }

  @Get('history/:otherUserId')
  @ApiOperation({ summary: 'Get chat history with a specific user' })
  @ApiParam({
    name: 'otherUserId',
    description: 'ID of the other user in the chat',
  })
  @ApiResponse({ status: 200, description: 'Returns chat history.' })
  async getHistory(
    @Param('otherUserId') otherUserId: string,
    @Request() req: any,
  ) {
    return this.chatService.getChatHistory(req.user.userId, otherUserId);
  }
}

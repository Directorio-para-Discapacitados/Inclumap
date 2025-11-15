import {
  Body,
  Controller,
  Post,
  InternalServerErrorException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';
import { ChatbotService } from './chatbot.service';

@ApiTags('chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleChat(
    @Body() chatRequestDto: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    try {
      return await this.chatbotService.generateResponse(chatRequestDto);
    } catch (error) {
      console.error('Error en ChatbotController:', error);
      throw new InternalServerErrorException(
        'Error al procesar la solicitud del chat',
      );
    }
  }
}

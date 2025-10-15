import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WhatsappService, WhatsAppMessage, WhatsAppTemplate } from './whatsapp.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SendTemplateDto } from './dto/send-template.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';

@ApiTags('whatsapp')
@Controller('whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('send-message')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Enviar mensagem via WhatsApp' })
  @ApiResponse({ status: 200, description: 'Mensagem enviada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async sendMessage(@Body() sendMessageDto: SendMessageDto) {
    const message: WhatsAppMessage = {
      to: sendMessageDto.to,
      message: sendMessageDto.message,
      type: sendMessageDto.type || 'text',
      mediaUrl: sendMessageDto.mediaUrl,
      filename: sendMessageDto.filename,
    };

    const success = await this.whatsappService.sendMessage(message);
    return {
      success,
      message: success ? 'Mensagem enviada com sucesso' : 'Erro ao enviar mensagem',
    };
  }

  @Post('send-template')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Enviar mensagem de template via WhatsApp' })
  @ApiResponse({ status: 200, description: 'Template enviado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async sendTemplate(@Body() sendTemplateDto: SendTemplateDto) {
    const template: WhatsAppTemplate = {
      name: sendTemplateDto.templateName,
      language: sendTemplateDto.language,
      parameters: sendTemplateDto.parameters,
    };

    const success = await this.whatsappService.sendTemplateMessage(template, sendTemplateDto.to);
    return {
      success,
      message: success ? 'Template enviado com sucesso' : 'Erro ao enviar template',
    };
  }

  @Post('validate-phone')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Validar número de telefone' })
  @ApiResponse({ status: 200, description: 'Resultado da validação' })
  async validatePhone(@Body('phone') phone: string) {
    const isValid = await this.whatsappService.validatePhoneNumber(phone);
    return {
      isValid,
      message: isValid ? 'Número válido' : 'Número inválido',
    };
  }

  @Post('format-phone')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Formatar número de telefone' })
  @ApiResponse({ status: 200, description: 'Número formatado' })
  async formatPhone(@Body('phone') phone: string) {
    try {
      const formattedPhone = await this.whatsappService.formatPhoneNumber(phone);
      return {
        success: true,
        formattedPhone,
        message: 'Número formatado com sucesso',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

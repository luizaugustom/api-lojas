import {
  Controller,
  Post,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { N8nService } from './n8n.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';

@ApiTags('n8n')
@Controller('n8n')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class N8nController {
  constructor(private readonly n8nService: N8nService) {}

  @Post('test')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Testar webhook do N8N' })
  @ApiResponse({ status: 200, description: 'Webhook testado com sucesso' })
  async testWebhook() {
    const success = await this.n8nService.testWebhook();
    return {
      success,
      message: success ? 'Webhook testado com sucesso' : 'Erro ao testar webhook',
    };
  }

  @Get('status')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter status da integração N8N' })
  @ApiResponse({ status: 200, description: 'Status da integração' })
  async getStatus() {
    const status = await this.n8nService.getWebhookStatus();
    return status;
  }

  @Get('webhook-url')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter URL do webhook N8N' })
  @ApiResponse({ status: 200, description: 'URL do webhook' })
  async getWebhookUrl() {
    const url = this.n8nService.getWebhookUrl();
    return {
      webhookUrl: url,
      message: 'URL do webhook N8N',
    };
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  BadRequestException,
  NotFoundException,
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
import { SendInstallmentBillingDto, SendCustomerBillingDto } from './dto/send-billing.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@ApiTags('whatsapp')
@Controller('whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly prisma: PrismaService,
  ) {}

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

  @Get('status')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Verificar status da instância WhatsApp' })
  @ApiResponse({ status: 200, description: 'Status da instância' })
  async getStatus() {
    const status = await this.whatsappService.checkInstanceStatus();
    return {
      connected: status.connected,
      status: status.status,
      message: status.connected
        ? 'Instância WhatsApp conectada e pronta para enviar mensagens'
        : `Instância WhatsApp não está conectada. Status: ${status.status || 'desconhecido'}`,
    };
  }

  @Post('send-installment-billing')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Enviar mensagem de cobrança de uma parcela específica' })
  @ApiResponse({ status: 200, description: 'Mensagem de cobrança enviada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Parcela não encontrada' })
  async sendInstallmentBilling(
    @Body() sendBillingDto: SendInstallmentBillingDto,
    @CurrentUser() user: any,
  ) {
    const companyId = user.companyId || user.id;

    // Buscar a parcela
    const installment = await this.prisma.installment.findFirst({
      where: {
        id: sendBillingDto.installmentId,
        companyId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        sale: {
          select: {
            id: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!installment) {
      throw new NotFoundException('Parcela não encontrada');
    }

    if (!installment.customer.phone) {
      throw new BadRequestException('Cliente não possui número de telefone cadastrado');
    }

    if (installment.isPaid) {
      throw new BadRequestException('Parcela já foi paga completamente');
    }

    // Preparar dados para a mensagem
    const billingData = {
      customerName: installment.customer.name,
      installmentNumber: installment.installmentNumber,
      totalInstallments: installment.totalInstallments,
      amount: installment.amount.toNumber(),
      remainingAmount: installment.remainingAmount.toNumber(),
      dueDate: installment.dueDate,
      description: installment.description,
      saleId: installment.sale.id,
      companyName: installment.company.name,
    };

    // Enviar mensagem
    const success = await this.whatsappService.sendInstallmentBilling(
      billingData,
      installment.customer.phone,
    );

    // Atualizar contador de mensagens enviadas
    if (success) {
      await this.prisma.installment.update({
        where: { id: installment.id },
        data: {
          lastMessageSentAt: new Date(),
          messageCount: {
            increment: 1,
          },
        },
      });
    }

    return {
      success,
      message: success
        ? 'Mensagem de cobrança enviada com sucesso'
        : 'Erro ao enviar mensagem de cobrança',
    };
  }

  @Post('send-customer-billing')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Enviar mensagem de cobrança para um cliente (todas ou parcelas específicas)' })
  @ApiResponse({ status: 200, description: 'Mensagem de cobrança enviada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async sendCustomerBilling(
    @Body() sendBillingDto: SendCustomerBillingDto,
    @CurrentUser() user: any,
  ) {
    const companyId = user.companyId || user.id;

    // Buscar o cliente
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: sendBillingDto.customerId,
        companyId,
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    if (!customer.phone) {
      throw new BadRequestException('Cliente não possui número de telefone cadastrado');
    }

    // Buscar parcelas
    let installments;
    if (sendBillingDto.sendAll) {
      installments = await this.prisma.installment.findMany({
        where: {
          customerId: customer.id,
          companyId,
          isPaid: false,
        },
        include: {
          sale: {
            select: {
              id: true,
              total: true,
              saleDate: true,
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
      });
    } else if (sendBillingDto.installmentIds && sendBillingDto.installmentIds.length > 0) {
      installments = await this.prisma.installment.findMany({
        where: {
          id: { in: sendBillingDto.installmentIds },
          customerId: customer.id,
          companyId,
          isPaid: false,
        },
        orderBy: {
          dueDate: 'asc',
        },
      });
    } else {
      throw new BadRequestException('Selecione parcelas para cobrança ou envie todas');
    }

    if (!installments || installments.length === 0) {
      throw new NotFoundException('Nenhuma parcela pendente encontrada');
    }

    // Preparar dados das parcelas
    const installmentsData = installments.map(inst => ({
      installmentNumber: inst.installmentNumber,
      totalInstallments: inst.totalInstallments,
      amount: inst.amount.toNumber(),
      remainingAmount: inst.remainingAmount.toNumber(),
      dueDate: inst.dueDate,
      description: inst.description,
    }));

    // Enviar mensagem
    const success = await this.whatsappService.sendMultipleInstallmentsBilling(
      customer.name,
      customer.phone,
      installmentsData,
      customer.company.name,
    );

    // Atualizar contador de mensagens enviadas
    if (success) {
      await this.prisma.installment.updateMany({
        where: {
          id: { in: installments.map(inst => inst.id) },
        },
        data: {
          lastMessageSentAt: new Date(),
          messageCount: {
            increment: 1,
          },
        },
      });
    }

    return {
      success,
      message: success
        ? `Mensagem de cobrança enviada com sucesso para ${installments.length} parcela(s)`
        : 'Erro ao enviar mensagem de cobrança',
      installmentsCount: installments.length,
    };
  }
}

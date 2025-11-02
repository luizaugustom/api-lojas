import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PrinterService, PrinterConfig } from './printer.service';
import { AddPrinterDto } from './dto/add-printer.dto';
import { UpdateCustomFooterDto } from './dto/update-custom-footer.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UuidValidationPipe } from '../../shared/pipes/uuid-validation.pipe';

@ApiTags('printer')
@Controller('printer')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  @Post('discover')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Descobrir impressoras disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de impressoras descobertas' })
  async discoverPrinters(): Promise<PrinterConfig[]> {
    return this.printerService.discoverPrinters();
  }

  @Post()
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Adicionar nova impressora' })
  @ApiResponse({ status: 201, description: 'Impressora adicionada com sucesso' })
  async addPrinter(
    @CurrentUser() user: any,
    @Body() printerConfig: AddPrinterDto,
  ) {
    // Validação adicional de segurança
    if (!user.companyId) {
      throw new BadRequestException('Usuário não possui empresa associada');
    }
    
    return this.printerService.addPrinter(user.companyId, printerConfig);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Listar impressoras' })
  @ApiResponse({ status: 200, description: 'Lista de impressoras' })
  async getPrinters(@CurrentUser() user: any) {
    if (user.role === UserRole.ADMIN) {
      return this.printerService.getPrinters();
    }
    return this.printerService.getPrinters(user.companyId);
  }

  @Get(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter status da impressora' })
  @ApiResponse({ status: 200, description: 'Status da impressora' })
  async getPrinterStatus(@Param('id', UuidValidationPipe) id: string) {
    return this.printerService.getPrinterStatus(id);
  }

  @Post(':id/test')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Testar impressora' })
  @ApiResponse({ status: 200, description: 'Teste realizado com sucesso' })
  async testPrinter(@Param('id', UuidValidationPipe) id: string) {
    const result = await this.printerService.testPrinter(id);
    if (result.success) {
      return { success: true, message: 'Teste realizado com sucesso' };
    } else {
      throw new BadRequestException(result.details?.reason || result.error || 'Falha no teste da impressora');
    }
  }

  @Post('custom-footer')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Atualizar footer personalizado para NFCe' })
  @ApiResponse({ status: 200, description: 'Footer personalizado atualizado com sucesso' })
  async updateCustomFooter(
    @CurrentUser() user: any,
    @Body() updateCustomFooterDto: UpdateCustomFooterDto,
  ) {
    await this.printerService.updateCustomFooter(user.companyId, updateCustomFooterDto.customFooter || '');
    return { message: 'Footer personalizado atualizado com sucesso' };
  }

  @Get('custom-footer')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter footer personalizado atual' })
  @ApiResponse({ status: 200, description: 'Footer personalizado atual' })
  async getCustomFooter(@CurrentUser() user: any) {
    const customFooter = await this.printerService.getCustomFooter(user.companyId);
    return { customFooter };
  }

  @Get('available')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Listar impressoras disponíveis no sistema' })
  @ApiResponse({ status: 200, description: 'Lista de impressoras do sistema' })
  async getAvailablePrinters(@CurrentUser() user: any) {
    // Retorna impressoras do computador do cliente (se houver) e do banco de dados
    const computerId = (user as any).computerId;
    const companyId = user.role === UserRole.ADMIN ? undefined : user.companyId;
    return await this.printerService.getAvailablePrinters(computerId, companyId);
  }

  @Post('register-devices')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Registra impressoras detectadas do computador do cliente' })
  @ApiResponse({ status: 200, description: 'Impressoras registradas com sucesso' })
  async registerDevices(
    @CurrentUser() user: any,
    @Body() body: { computerId: string; printers: any[] },
  ) {
    if (!user.companyId) {
      throw new BadRequestException('Usuário não possui empresa associada');
    }
    
    const result = await this.printerService.registerClientDevices(
      body.computerId,
      body.printers,
      user.companyId,
    );
    
    return result;
  }

  @Get('check-drivers')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Verificar drivers de impressora instalados' })
  @ApiResponse({ status: 200, description: 'Status dos drivers' })
  async checkDrivers() {
    return await this.printerService.checkDrivers();
  }

  @Post('install-drivers')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Instalar drivers de impressora' })
  @ApiResponse({ status: 200, description: 'Resultado da instalação' })
  async installDrivers() {
    return await this.printerService.installDrivers();
  }

  @Post('check-drivers')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Verificar e instalar drivers de impressora (DEPRECATED)' })
  @ApiResponse({ status: 200, description: 'Status dos drivers' })
  async checkAndInstallDrivers() {
    return await this.printerService.checkAndInstallDrivers();
  }

  @Post(':id/open-drawer')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Abrir gaveta de dinheiro' })
  @ApiResponse({ status: 200, description: 'Gaveta aberta com sucesso' })
  async openCashDrawer(@Param('id', UuidValidationPipe) id: string) {
    const success = await this.printerService.openCashDrawer(id);
    return { success, message: success ? 'Gaveta aberta com sucesso' : 'Falha ao abrir gaveta' };
  }

  @Get(':id/queue')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter fila de impressão' })
  @ApiResponse({ status: 200, description: 'Fila de impressão' })
  async getPrintQueue(@Param('id', UuidValidationPipe) id: string) {
    return await this.printerService.getPrintQueue(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Excluir impressora' })
  @ApiResponse({ status: 200, description: 'Impressora excluída com sucesso' })
  async deletePrinter(
    @CurrentUser() user: any,
    @Param('id', UuidValidationPipe) id: string,
  ) {
    if (!id) throw new BadRequestException('ID inválido');
    const result = await this.printerService.deletePrinter(user, id);
    return { success: true, deletedId: result.id };
  }
}

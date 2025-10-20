import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PrinterService, PrinterConfig } from './printer.service';
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
    @Body() printerConfig: PrinterConfig,
  ) {
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
    const success = await this.printerService.testPrinter(id);
    return { success, message: success ? 'Teste realizado com sucesso' : 'Falha no teste da impressora' };
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
}

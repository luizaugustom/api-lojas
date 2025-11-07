import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateFiscalConfigDto } from './dto/update-fiscal-config.dto';
import { UpdateCatalogPageDto } from './dto/update-catalog-page.dto';
import { UpdateCompanyDataPeriodDto } from './dto/update-data-period.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UuidValidationPipe } from '../../shared/pipes/uuid-validation.pipe';
import { PlanLimitsService } from '../../shared/services/plan-limits.service';

@ApiTags('company')
@Controller('company')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly planLimitsService: PlanLimitsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar nova empresa' })
  @ApiResponse({ status: 201, description: 'Empresa criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Dados já estão em uso' })
  create(
    @CurrentUser() user: any,
    @Body() createCompanyDto: CreateCompanyDto,
  ) {
    return this.companyService.create(user.id, createCompanyDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Listar empresas' })
  @ApiResponse({ status: 200, description: 'Lista de empresas' })
  findAll(@CurrentUser() user: any) {
    if (user.role === UserRole.ADMIN) {
      return this.companyService.findAll();
    }
    return this.companyService.findAll(user.companyId);
  }

  @Get('my-company')
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Obter dados da própria empresa' })
  @ApiResponse({ status: 200, description: 'Dados da empresa' })
  findMyCompany(@CurrentUser() user: any) {
    return this.companyService.findOne(user.companyId);
  }

  @Get('stats')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter estatísticas da empresa' })
  @ApiResponse({ status: 200, description: 'Estatísticas da empresa' })
  getStats(@CurrentUser() user: any) {
    return this.companyService.getCompanyStats(user.companyId);
  }

  @Get('plan-usage')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter estatísticas de uso do plano' })
  @ApiResponse({ status: 200, description: 'Estatísticas de uso do plano da empresa' })
  getPlanUsage(@CurrentUser() user: any) {
    return this.planLimitsService.getCompanyUsageStats(user.companyId);
  }

  @Get('plan-warnings')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Verificar alertas de limites próximos' })
  @ApiResponse({ status: 200, description: 'Alertas sobre limites próximos de serem atingidos' })
  getPlanWarnings(@CurrentUser() user: any) {
    return this.planLimitsService.checkNearLimits(user.companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Buscar empresa por ID' })
  @ApiResponse({ status: 200, description: 'Empresa encontrada' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  findOne(@Param('id', UuidValidationPipe) id: string) {
    return this.companyService.findOne(id);
  }

  @Patch('my-company')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Atualizar dados da própria empresa' })
  @ApiResponse({ status: 200, description: 'Empresa atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 409, description: 'Dados já estão em uso' })
  updateMyCompany(
    @CurrentUser() user: any,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companyService.update(user.companyId, updateCompanyDto);
  }

  @Patch('my-company/data-period')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Atualizar período padrão dos dados' })
  @ApiResponse({ status: 200, description: 'Período padrão atualizado com sucesso' })
  updateDataPeriod(
    @CurrentUser() user: any,
    @Body() updateDataPeriodDto: UpdateCompanyDataPeriodDto,
  ) {
    return this.companyService.updateDataPeriod(user.companyId, updateDataPeriodDto.dataPeriod);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Ativar empresa' })
  @ApiResponse({ status: 200, description: 'Empresa ativada com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  activate(@Param('id', UuidValidationPipe) id: string) {
    return this.companyService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Desativar empresa' })
  @ApiResponse({ status: 200, description: 'Empresa desativada com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  deactivate(@Param('id', UuidValidationPipe) id: string) {
    return this.companyService.deactivate(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar empresa' })
  @ApiResponse({ status: 200, description: 'Empresa atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 409, description: 'Dados já estão em uso' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover empresa' })
  @ApiResponse({ status: 200, description: 'Empresa removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  remove(@Param('id', UuidValidationPipe) id: string) {
    return this.companyService.remove(id);
  }

  @Patch('my-company/fiscal-config')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Atualizar configurações fiscais (Focus NFe)' })
  @ApiResponse({ status: 200, description: 'Configurações fiscais atualizadas com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  updateFiscalConfig(
    @CurrentUser() user: any,
    @Body() updateFiscalConfigDto: UpdateFiscalConfigDto,
  ) {
    return this.companyService.updateFiscalConfig(user.companyId, updateFiscalConfigDto);
  }

  @Get('my-company/fiscal-config')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter configurações fiscais (dados sensíveis mascarados)' })
  @ApiResponse({ status: 200, description: 'Configurações fiscais' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  getFiscalConfig(@CurrentUser() user: any) {
    return this.companyService.getFiscalConfig(user.companyId);
  }

  @Get('my-company/fiscal-config/valid')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Verificar se a empresa tem configuração fiscal válida para emissão de NFCe' })
  @ApiResponse({ status: 200, description: 'Status da configuração fiscal' })
  async hasValidFiscalConfig(@CurrentUser() user: any) {
    const isValid = await this.companyService.hasValidFiscalConfig(user.companyId);
    return { hasValidConfig: isValid };
  }

  @Post('my-company/upload-certificate')
  @Roles(UserRole.COMPANY)
  @UseInterceptors(FileInterceptor('certificate'))
  @ApiOperation({ summary: 'Upload do certificado digital para Focus NFe' })
  @ApiResponse({ status: 200, description: 'Certificado enviado com sucesso ao Focus NFe' })
  @ApiResponse({ status: 400, description: 'Erro no upload ou certificado inválido' })
  uploadCertificate(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.companyService.uploadCertificateToFocusNfe(user.companyId, file);
  }

  @Post('my-company/upload-logo')
  @Roles(UserRole.COMPANY)
  @UseInterceptors(FileInterceptor('logo'))
  @ApiOperation({ summary: 'Upload do logo da empresa' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Logo da empresa',
    schema: {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Logo enviado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro no upload ou arquivo inválido' })
  uploadLogo(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.companyService.uploadLogo(user.companyId, file);
  }

  @Delete('my-company/logo')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Remover logo da empresa' })
  @ApiResponse({ status: 200, description: 'Logo removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  removeLogo(@CurrentUser() user: any) {
    return this.companyService.removeLogo(user.companyId);
  }

  @Patch('my-company/auto-message/enable')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Ativar envio automático de mensagens de cobrança' })
  @ApiResponse({ status: 200, description: 'Envio automático de mensagens ativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  enableAutoMessages(@CurrentUser() user: any) {
    return this.companyService.toggleAutoMessages(user.companyId, true);
  }

  @Patch('my-company/auto-message/disable')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Desativar envio automático de mensagens de cobrança' })
  @ApiResponse({ status: 200, description: 'Envio automático de mensagens desativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  disableAutoMessages(@CurrentUser() user: any) {
    return this.companyService.toggleAutoMessages(user.companyId, false);
  }

  @Get('my-company/auto-message/status')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Verificar status do envio automático de mensagens' })
  @ApiResponse({ status: 200, description: 'Status do envio automático de mensagens' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  getAutoMessageStatus(@CurrentUser() user: any) {
    return this.companyService.getAutoMessageStatus(user.companyId);
  }

  @Patch('my-company/catalog-page')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Configurar página de catálogo pública' })
  @ApiResponse({ status: 200, description: 'Configurações da página de catálogo atualizadas' })
  @ApiResponse({ status: 409, description: 'URL já está em uso' })
  updateCatalogPage(
    @CurrentUser() user: any,
    @Body() updateCatalogPageDto: UpdateCatalogPageDto,
  ) {
    return this.companyService.updateCatalogPage(user.companyId, updateCatalogPageDto);
  }

  @Get('my-company/catalog-page')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter configurações da página de catálogo' })
  @ApiResponse({ status: 200, description: 'Configurações da página de catálogo' })
  getCatalogPageConfig(@CurrentUser() user: any) {
    return this.companyService.getCatalogPageConfig(user.companyId);
  }
}

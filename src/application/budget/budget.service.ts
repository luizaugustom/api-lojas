import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto, BudgetStatus } from './dto/update-budget.dto';
import { PrinterService } from '../printer/printer.service';
import { SaleService } from '../sale/sale.service';
import { PaymentMethod } from '../sale/dto/payment-method.dto';
import { ClientTimeInfo, formatClientDate, formatClientDateOnly, getClientNow } from '../../shared/utils/client-time.util';
import * as PDFDocument from 'pdfkit';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface BudgetPrintData {
  company: {
    id: string;
    name: string;
    cnpj: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  };
  budget: {
    id: string;
    budgetNumber: number;
    budgetDate: Date;
    validUntil: Date;
    total: number;
    status: string;
    notes?: string;
  };
  client?: {
    name?: string;
    phone?: string;
    email?: string;
    cpfCnpj?: string;
  };
  items: Array<{
    productName: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  seller?: {
    name: string;
  };
  metadata?: {
    clientTimeInfo?: ClientTimeInfo;
  };
}

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly printerService: PrinterService,
    @Inject(forwardRef(() => SaleService))
    private readonly saleService: SaleService,
  ) {}

  async create(companyId: string, sellerId: string | undefined, createBudgetDto: CreateBudgetDto) {
    try {
      this.logger.log(`Creating budget for company: ${companyId}`);
      this.logger.log(`Items: ${JSON.stringify(createBudgetDto.items)}`);

      // Validate products exist and are from the same company
      const productIds = createBudgetDto.items.map(item => item.productId);
      this.logger.log(`Product IDs: ${productIds.join(', ')}`);
      
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: productIds },
          companyId,
        },
      });

      this.logger.log(`Found ${products.length} products out of ${productIds.length} requested`);

      if (products.length !== productIds.length) {
        const foundIds = products.map(p => p.id);
        const missingIds = productIds.filter(id => !foundIds.includes(id));
        this.logger.error(`Missing products: ${missingIds.join(', ')}`);
        throw new BadRequestException(`Um ou mais produtos não foram encontrados: ${missingIds.join(', ')}`);
      }

      // Calculate total and prepare items
      let total = 0;
      const validatedItems = createBudgetDto.items.map(item => {
        const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Produto ${item.productId} não encontrado`);
      }

      const unitPrice = Number(product.price);
      const totalPrice = unitPrice * item.quantity;
      total += totalPrice;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      };
    });

    // Get next budget number for this company
    const lastBudget = await this.prisma.budget.findFirst({
      where: { companyId },
      orderBy: { budgetNumber: 'desc' },
    });

    const budgetNumber = (lastBudget?.budgetNumber || 0) + 1;

    // Create budget with items in a transaction
    const budget = await this.prisma.$transaction(async (tx) => {
      const newBudget = await tx.budget.create({
        data: {
          companyId,
          sellerId: sellerId || null,
          budgetNumber,
          total,
          clientName: createBudgetDto.clientName,
          clientPhone: createBudgetDto.clientPhone,
          clientEmail: createBudgetDto.clientEmail,
          clientCpfCnpj: createBudgetDto.clientCpfCnpj,
          notes: createBudgetDto.notes,
          validUntil: new Date(createBudgetDto.validUntil),
          status: 'pending',
        },
      });

      // Create budget items
      for (const item of validatedItems) {
        await tx.budgetItem.create({
          data: {
            ...item,
            budgetId: newBudget.id,
          },
        });
      }

      return newBudget;
    });

    // Get complete budget data
    const completeBudget = await this.prisma.budget.findUnique({
      where: { id: budget.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
                price: true,
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            cnpj: true,
            street: true,
            number: true,
            district: true,
            phone: true,
            email: true,
            logoUrl: true,
          },
        },
      },
    });

      this.logger.log(`Budget created successfully with ID: ${budget.id}`);

      return completeBudget;
    } catch (error) {
      this.logger.error(`Error creating budget: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(
    companyId: string,
    sellerId?: string,
    status?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { companyId };

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.budgetDate = {};
      if (startDate) {
        where.budgetDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.budgetDate.lte = new Date(endDate);
      }
    }

    const budgets = await this.prisma.budget.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
                price: true,
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        budgetDate: 'desc',
      },
    });

    return budgets;
  }

  async findOne(id: string, companyId?: string) {
    const where: any = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const budget = await this.prisma.budget.findUnique({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
                price: true,
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            cnpj: true,
            street: true,
            number: true,
            district: true,
            city: true,
            state: true,
            phone: true,
            email: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!budget) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    return budget;
  }

  async update(id: string, companyId: string, updateBudgetDto: UpdateBudgetDto) {
    const budget = await this.findOne(id, companyId);
    const oldStatus = budget.status;

    // Se o status foi alterado para approved, criar venda automaticamente
    if (updateBudgetDto.status === BudgetStatus.APPROVED && oldStatus !== BudgetStatus.APPROVED) {
      this.logger.log(`Budget ${id} status changed to approved, creating sale automatically`);

      // Verificar se o orçamento já tem vendedor associado
      if (!budget.sellerId) {
        throw new BadRequestException('Orçamento deve ter um vendedor associado para ser aprovado e gerar venda');
      }

      // Verificar se já existe uma venda para este orçamento
      const existingSale = await this.prisma.sale.findFirst({
        where: {
          companyId,
          // Procurar por venda com os mesmos itens e cliente
          items: {
            some: {
              productId: budget.items[0]?.productId,
            },
          },
          clientName: budget.clientName || undefined,
          clientCpfCnpj: budget.clientCpfCnpj || undefined,
          saleDate: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Últimos 5 minutos
          },
        },
      });

      if (existingSale) {
        this.logger.warn(`Sale already exists for budget ${id}, skipping automatic creation`);
      } else {
        try {
          // Preparar dados da venda baseados no orçamento
          const saleItems = budget.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
          }));

          // Criar venda com pagamento em dinheiro (valor total)
          const createSaleDto = {
            items: saleItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
            clientName: budget.clientName,
            clientCpfCnpj: budget.clientCpfCnpj,
            paymentMethods: [{
              method: PaymentMethod.CASH,
              amount: Number(budget.total),
            }],
            totalPaid: Number(budget.total),
            skipPrint: true, // Não imprimir automaticamente
          };

          // Criar a venda
          await this.saleService.create(companyId, budget.sellerId, createSaleDto);
          this.logger.log(`Sale created automatically for budget ${id}`);
        } catch (error) {
          this.logger.error(`Error creating sale for budget ${id}: ${error.message}`, error.stack);
          // Continuar com a atualização do orçamento mesmo se a venda falhar
          // O erro será logado mas não interromperá o processo
        }
      }
    }

    const updatedBudget = await this.prisma.budget.update({
      where: { id },
      data: {
        status: updateBudgetDto.status,
        notes: updateBudgetDto.notes,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        seller: true,
      },
    });

    this.logger.log(`Budget ${id} updated successfully`);

    return updatedBudget;
  }

  async remove(id: string, companyId: string) {
    const budget = await this.findOne(id, companyId);

    await this.prisma.budget.delete({
      where: { id },
    });

    this.logger.log(`Budget ${id} deleted successfully`);

    return { message: 'Orçamento excluído com sucesso' };
  }

  async printBudget(
    id: string,
    companyId?: string,
    computerId?: string | null,
    clientTimeInfo?: ClientTimeInfo,
  ) {
    const budget = await this.findOne(id, companyId);

    const printData = this.buildBudgetPrintData(budget, clientTimeInfo);

    const printResult = await this.printerService.printBudget(printData, computerId, clientTimeInfo);

    if (printResult.success) {
      this.logger.log(`Budget ${id} printed successfully`);
    } else {
      this.logger.warn(`Failed to print budget ${id}: ${printResult.error || 'motivo desconhecido'}`);
    }

    return {
      message: printResult.success ? 'Orçamento enviado para impressão' : (printResult.error || 'Não foi possível imprimir o orçamento'),
      success: printResult.success,
      error: printResult.success ? undefined : printResult.error,
      details: printResult.details,
      printContent: printResult.content,
    };
  }

  async generatePdf(id: string, companyId?: string, clientTimeInfo?: ClientTimeInfo): Promise<Buffer> {
    const budget = await this.findOne(id, companyId);

    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
        });

        const buffers: Buffer[] = [];

        doc.on('data', (buffer) => buffers.push(buffer));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          this.logger.log(`Budget ${id} PDF generated successfully`);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Generate the PDF content
        await this.generatePdfContent(doc, budget, clientTimeInfo);

        doc.end();
      } catch (error) {
        this.logger.error(`Error generating PDF: ${error.message}`, error.stack);
        reject(error);
      }
    });
  }

  private async generatePdfContent(doc: PDFKit.PDFDocument, budget: any, clientTimeInfo?: ClientTimeInfo): Promise<void> {
    const company = budget.company;
    const items = budget.items;
    const date = formatClientDateOnly(budget.budgetDate, clientTimeInfo);
    const validUntil = formatClientDateOnly(budget.validUntil, clientTimeInfo);
    
    let yPosition = doc.y;

    // ============================================
    // LOGO DA EMPRESA E TÍTULO
    // ============================================
    let hasLogo = false;
    
    if (company.logoUrl) {
      try {
        let logoBuffer: Buffer | null = null;
        
        // Tentar baixar a imagem da URL
        if (company.logoUrl.startsWith('http://') || company.logoUrl.startsWith('https://')) {
          try {
            const response = await axios.get(company.logoUrl, { responseType: 'arraybuffer', timeout: 5000 });
            logoBuffer = Buffer.from(response.data);
          } catch (error) {
            this.logger.warn(`Could not download logo from ${company.logoUrl}: ${error.message}`);
          }
        } else {
          // Tentar ler arquivo local
          try {
            const filePath = path.join(process.cwd(), 'uploads', company.logoUrl);
            if (fs.existsSync(filePath)) {
              logoBuffer = fs.readFileSync(filePath);
            }
          } catch (error) {
            this.logger.warn(`Could not read local logo file: ${error.message}`);
          }
        }

        // Se conseguiu obter o buffer, adicionar a logo ao PDF
        if (logoBuffer) {
          // Adicionar logo no topo direito
          doc.image(logoBuffer, 470, yPosition, { 
            width: 70, 
            height: 70, 
            fit: [70, 70]
          });
          hasLogo = true;
        }
      } catch (error) {
        this.logger.error(`Error adding logo to PDF: ${error.message}`);
        // Continua sem a logo se houver erro
      }
    }

    // Título centralizado
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#2C3E50')
      .text('ORÇAMENTO', { align: 'center' });
    
    yPosition = doc.y + 10;
    
    // Se não tem logo, ajustar a posição para compensar
    if (!hasLogo) {
      yPosition -= 10;
    }

    // Divisória após título
    doc
      .moveTo(50, yPosition)
      .lineTo(545, yPosition)
      .strokeColor('#34495E')
      .lineWidth(2)
      .stroke();

    yPosition += 20;
    doc.y = yPosition;

    // Dados da Empresa em destaque
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#2C3E50')
      .text(company.name, 50, yPosition, { width: 495 });
    
    yPosition = doc.y + 5;

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#34495E')
      .text(`CNPJ: ${company.cnpj}`, 50, yPosition);
    
    yPosition = doc.y + 3;

    if (company.street || company.number || company.district) {
      doc.text(
        `${company.street || ''}, ${company.number || ''} - ${company.district || ''}`,
        50,
        yPosition,
      );
      yPosition = doc.y + 3;
    }

    if (company.city || company.state) {
      doc.text(`${company.city || ''} - ${company.state || ''}`, 50, yPosition);
      yPosition = doc.y + 3;
    }

    if (company.phone) {
      doc.text(`Tel: ${company.phone}`, 50, yPosition);
      yPosition = doc.y + 3;
    }

    if (company.email) {
      doc.text(`Email: ${company.email}`, 50, yPosition);
      yPosition = doc.y;
    }

    yPosition += 15;

    // Divisória após dados da empresa
    doc
      .moveTo(50, yPosition)
      .lineTo(545, yPosition)
      .strokeColor('#BDC3C7')
      .lineWidth(1)
      .stroke();

    yPosition += 20;

    // ============================================
    // INFORMAÇÕES DO ORÇAMENTO
    // ============================================
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#2C3E50')
      .text('INFORMAÇÕES DO ORÇAMENTO', 50, yPosition);
    
    yPosition = doc.y + 10;

    // Box com informações do orçamento
    doc
      .rect(50, yPosition, 495, 45)
      .fillColor('#ECF0F1')
      .fill();

    yPosition += 10;

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#2C3E50')
      .text(`Orçamento Nº:`, 60, yPosition, { width: 100, continued: true })
      .font('Helvetica')
      .text(`${budget.budgetNumber}`, { width: 150 });

    doc
      .font('Helvetica-Bold')
      .text(`Data:`, 260, yPosition, { width: 80, continued: true })
      .font('Helvetica')
      .text(date || '-', { width: 150 });

    yPosition += 15;

    doc
      .font('Helvetica-Bold')
      .text(`Válido até:`, 60, yPosition, { width: 100, continued: true })
      .font('Helvetica')
      .text(validUntil || '-', { width: 150 });

    doc
      .font('Helvetica-Bold')
      .text(`Status:`, 260, yPosition, { width: 80, continued: true })
      .font('Helvetica')
      .text(this.translateStatus(budget.status), { width: 150 });

    yPosition += 30;

    // ============================================
    // DADOS DO CLIENTE (se existir)
    // ============================================
    if (budget.clientName) {
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#2C3E50')
        .text('DADOS DO CLIENTE', 50, yPosition);
      
      yPosition = doc.y + 10;

      // Calcular altura dinâmica do box baseado nos campos preenchidos
      let boxHeight = 30; // altura base
      if (budget.clientCpfCnpj || budget.clientPhone) boxHeight += 15;
      if (budget.clientEmail) boxHeight += 15;

      doc
        .rect(50, yPosition, 495, boxHeight)
        .fillColor('#ECF0F1')
        .fill();

      yPosition += 10;

      // Nome do cliente
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#2C3E50')
        .text(`Nome:`, 60, yPosition, { width: 80 });
      
      doc
        .font('Helvetica')
        .fillColor('#2C3E50')
        .text(budget.clientName, 145, yPosition, { width: 400 });

      yPosition += 15;

      // CPF/CNPJ e Telefone na mesma linha
      if (budget.clientCpfCnpj || budget.clientPhone) {
        if (budget.clientCpfCnpj) {
          doc
            .font('Helvetica-Bold')
            .fillColor('#2C3E50')
            .text(`CPF/CNPJ:`, 60, yPosition, { width: 80 });
          
          doc
            .font('Helvetica')
            .fillColor('#2C3E50')
            .text(budget.clientCpfCnpj, 145, yPosition, { width: 130 });
        }

        if (budget.clientPhone) {
          doc
            .font('Helvetica-Bold')
            .fillColor('#2C3E50')
            .text(`Telefone:`, 290, yPosition, { width: 80 });
          
          doc
            .font('Helvetica')
            .fillColor('#2C3E50')
            .text(budget.clientPhone, 365, yPosition, { width: 180 });
        }

        yPosition += 15;
      }

      // Email em linha separada
      if (budget.clientEmail) {
        doc
          .font('Helvetica-Bold')
          .fillColor('#2C3E50')
          .text(`Email:`, 60, yPosition, { width: 80 });
        
        doc
          .font('Helvetica')
          .fillColor('#2C3E50')
          .text(budget.clientEmail, 145, yPosition, { width: 400 });
        
        yPosition += 15;
      }

      yPosition += 10;
    }

    // ============================================
    // PRODUTOS - TABELA
    // ============================================
    yPosition += 5;

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#2C3E50')
      .text('PRODUTOS', 50, yPosition);
    
    yPosition = doc.y + 10;

    // Cabeçalho da tabela
    doc
      .rect(50, yPosition, 495, 25)
      .fillColor('#34495E')
      .fill();

    yPosition += 8;

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#FFFFFF')
      .text('Item', 60, yPosition, { width: 30 })
      .text('Produto', 95, yPosition, { width: 240 })
      .text('Qtd', 340, yPosition, { width: 40, align: 'center' })
      .text('Valor Unit.', 385, yPosition, { width: 70, align: 'right' })
      .text('Total', 460, yPosition, { width: 75, align: 'right' });

    yPosition += 17;

    // Linhas dos produtos
    items.forEach((item: any, index: number) => {
      // Verificar se precisa de nova página
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      // Linha zebrada
      if (index % 2 === 0) {
        doc
          .rect(50, yPosition, 495, 20)
          .fillColor('#F8F9FA')
          .fill();
      }

      yPosition += 6;

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#2C3E50')
        .text(`${index + 1}`, 60, yPosition, { width: 30 })
        .text(item.product.name.substring(0, 50), 95, yPosition, { width: 240 })
        .text(`${item.quantity}`, 340, yPosition, { width: 40, align: 'center' })
        .text(`R$ ${Number(item.unitPrice).toFixed(2)}`, 385, yPosition, { width: 70, align: 'right' })
        .text(`R$ ${Number(item.totalPrice).toFixed(2)}`, 460, yPosition, { width: 75, align: 'right' });

      yPosition += 14;
    });

    // Linha de fechamento da tabela
    doc
      .moveTo(50, yPosition)
      .lineTo(545, yPosition)
      .strokeColor('#BDC3C7')
      .lineWidth(1)
      .stroke();

    yPosition += 15;

    // ============================================
    // TOTAL
    // ============================================
    doc
      .rect(370, yPosition, 175, 35)
      .fillColor('#27AE60')
      .fill();

    yPosition += 10;

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#FFFFFF')
      .text('TOTAL:', 380, yPosition, { width: 80 })
      .text(`R$ ${Number(budget.total).toFixed(2)}`, 450, yPosition, { width: 85, align: 'right' });

    yPosition += 30;

    // ============================================
    // OBSERVAÇÕES (se existir)
    // ============================================
    if (budget.notes) {
      yPosition += 10;

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#2C3E50')
        .text('OBSERVAÇÕES', 50, yPosition);
      
      yPosition = doc.y + 10;

      doc
        .rect(50, yPosition, 495, 60)
        .fillColor('#FFF9E6')
        .fill();

      yPosition += 10;

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#2C3E50')
        .text(budget.notes, 60, yPosition, { width: 475, align: 'left' });

      yPosition = doc.y + 10;
    }

    // ============================================
    // RODAPÉ
    // ============================================
    yPosition = 750;

    // Divisória antes do rodapé
    doc
      .moveTo(50, yPosition)
      .lineTo(545, yPosition)
      .strokeColor('#BDC3C7')
      .lineWidth(1)
      .stroke();

    yPosition += 10;

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#7F8C8D')
      .text(
        `Documento gerado em ${formatClientDate(getClientNow(clientTimeInfo), clientTimeInfo)}`,
        50,
        yPosition,
        { align: 'center', width: 495 }
      );

    if (budget.seller) {
      yPosition = doc.y + 5;
      doc.text(`Vendedor(a): ${budget.seller.name}`, 50, yPosition, { align: 'center', width: 495 });
    }
  }

  private translateStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      expired: 'Expirado',
    };
    return statusMap[status] || status;
  }

  async getPrintContent(
    id: string,
    companyId?: string,
    clientTimeInfo?: ClientTimeInfo,
  ) {
    const budget = await this.findOne(id, companyId);
    const printData = this.buildBudgetPrintData(budget, clientTimeInfo);
    const content = await this.printerService.getBudgetPrintContent(printData, clientTimeInfo);

    return {
      content,
      budgetNumber: budget.budgetNumber,
    };
  }

  private buildBudgetPrintData(
    budget: any,
    clientTimeInfo?: ClientTimeInfo,
  ): BudgetPrintData {
    return {
      company: {
        id: budget.companyId,
        name: budget.company.name,
        cnpj: budget.company.cnpj,
        address: `${budget.company.street || ''}, ${budget.company.number || ''} - ${budget.company.district || ''}`,
        phone: budget.company.phone,
        email: budget.company.email,
        logoUrl: budget.company.logoUrl,
      },
      budget: {
        id: budget.id,
        budgetNumber: budget.budgetNumber,
        budgetDate: budget.budgetDate,
        validUntil: budget.validUntil,
        total: Number(budget.total),
        status: budget.status,
        notes: budget.notes,
      },
      client: budget.clientName
        ? {
            name: budget.clientName,
            phone: budget.clientPhone,
            email: budget.clientEmail,
            cpfCnpj: budget.clientCpfCnpj,
          }
        : undefined,
      items: budget.items.map((item: any) => ({
        productName: item.product.name,
        barcode: item.product.barcode,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      seller: budget.seller
        ? {
            name: budget.seller.name,
          }
        : undefined,
      metadata: {
        clientTimeInfo,
      },
    };
  }

  async convertToSale(id: string, companyId: string, sellerId: string) {
    const budget = await this.findOne(id, companyId);

    if (budget.status !== 'pending' && budget.status !== 'approved') {
      throw new BadRequestException('Apenas orçamentos pendentes ou aprovados podem ser convertidos em vendas');
    }

    // Update budget status to approved
    await this.prisma.budget.update({
      where: { id },
      data: { status: 'approved' },
    });

    this.logger.log(`Budget ${id} marked as approved for conversion to sale`);

    return {
      message: 'Orçamento aprovado. Use os dados para criar uma venda.',
      budgetData: {
        items: budget.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        clientName: budget.clientName,
        clientCpfCnpj: budget.clientCpfCnpj,
      },
    };
  }
}


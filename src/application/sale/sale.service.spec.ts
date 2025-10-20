import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createPrismaMock } from '../../../test/utils/prisma-mock';
import { createTestModuleWithMockedPrisma } from '../../../test/utils/test-helpers';
import { ProductService } from '../product/product.service';
import { PrinterService } from '../printer/printer.service';
import { FiscalService } from '../fiscal/fiscal.service';
import { EmailService } from '../../shared/services/email.service';
import { SaleService } from './sale.service';

describe('SaleService', () => {
  let service: SaleService;
  const prismaMock = createPrismaMock();

  beforeEach(async () => {
    const productServiceMock = { findOne: jest.fn() };
    const printerServiceMock = { printNFCe: jest.fn(), printReceipt: jest.fn() };
    const fiscalServiceMock = { generateNFCe: jest.fn() };
    const emailServiceMock = { sendSaleConfirmationEmail: jest.fn() };

    const mod = await createTestModuleWithMockedPrisma(SaleService, [
      { provide: ProductService, useValue: productServiceMock },
      { provide: PrinterService, useValue: printerServiceMock },
      { provide: FiscalService, useValue: fiscalServiceMock },
      { provide: EmailService, useValue: emailServiceMock },
    ]);
    service = mod.get<SaleService>(SaleService);
    jest.clearAllMocks();
  });

  it('should create a sale when products exist and stock is enough', async () => {
    prismaMock.product.findFirst.mockResolvedValue({ id: 'p1', price: { toNumber: () => 10 }, stockQuantity: 5 });
    // simulate transaction result
    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      // call the callback with a tx that points to prismaMock methods (simple implementation)
      return cb(prismaMock);
    });
    prismaMock.sale.create.mockResolvedValue({ id: 'sale1', total: 10 });
    prismaMock.sale.findUnique.mockResolvedValue({ id: 'sale1', items: [], paymentMethods: [], seller: { name: 's' }, company: { name: 'c' } });

    const dto: any = { items: [{ productId: 'p1', quantity: 1 }], paymentMethods: [{ method: 'cash', amount: 10 }] };
    const result = await service.create('comp1', 's1', dto);
    expect(prismaMock.product.findFirst).toHaveBeenCalled();
    expect(prismaMock.sale.create).toHaveBeenCalled();
    expect(result).toHaveProperty('id');
  });

  it('should throw when product not found', async () => {
    prismaMock.product.findFirst.mockResolvedValue(null);
    const dto: any = { items: [{ productId: 'pX', quantity: 1 }], paymentMethods: [{ method: 'cash', amount: 10 }] };
    await expect(service.create('comp1', 's1', dto)).rejects.toThrow(NotFoundException);
  });
});

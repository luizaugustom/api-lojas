"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const prisma_mock_1 = require("../../../test/utils/prisma-mock");
const test_helpers_1 = require("../../../test/utils/test-helpers");
const product_service_1 = require("../product/product.service");
const printer_service_1 = require("../printer/printer.service");
const fiscal_service_1 = require("../fiscal/fiscal.service");
const email_service_1 = require("../../shared/services/email.service");
const sale_service_1 = require("./sale.service");
describe('SaleService', () => {
    let service;
    const prismaMock = (0, prisma_mock_1.createPrismaMock)();
    beforeEach(async () => {
        const productServiceMock = { findOne: jest.fn() };
        const printerServiceMock = { printNFCe: jest.fn(), printReceipt: jest.fn() };
        const fiscalServiceMock = { generateNFCe: jest.fn() };
        const emailServiceMock = { sendSaleConfirmationEmail: jest.fn() };
        const mod = await (0, test_helpers_1.createTestModuleWithMockedPrisma)(sale_service_1.SaleService, [
            { provide: product_service_1.ProductService, useValue: productServiceMock },
            { provide: printer_service_1.PrinterService, useValue: printerServiceMock },
            { provide: fiscal_service_1.FiscalService, useValue: fiscalServiceMock },
            { provide: email_service_1.EmailService, useValue: emailServiceMock },
        ]);
        service = mod.get(sale_service_1.SaleService);
        jest.clearAllMocks();
    });
    it('should create a sale when products exist and stock is enough', async () => {
        prismaMock.product.findFirst.mockResolvedValue({ id: 'p1', price: { toNumber: () => 10 }, stockQuantity: 5 });
        prismaMock.$transaction.mockImplementation(async (cb) => {
            return cb(prismaMock);
        });
        prismaMock.sale.create.mockResolvedValue({ id: 'sale1', total: 10 });
        prismaMock.sale.findUnique.mockResolvedValue({ id: 'sale1', items: [], paymentMethods: [], seller: { name: 's' }, company: { name: 'c' } });
        const dto = { items: [{ productId: 'p1', quantity: 1 }], paymentMethods: [{ method: 'cash', amount: 10 }] };
        const result = await service.create('comp1', 's1', dto);
        expect(prismaMock.product.findFirst).toHaveBeenCalled();
        expect(prismaMock.sale.create).toHaveBeenCalled();
        expect(result).toHaveProperty('id');
    });
    it('should throw when product not found', async () => {
        prismaMock.product.findFirst.mockResolvedValue(null);
        const dto = { items: [{ productId: 'pX', quantity: 1 }], paymentMethods: [{ method: 'cash', amount: 10 }] };
        await expect(service.create('comp1', 's1', dto)).rejects.toThrow(common_1.NotFoundException);
    });
});
//# sourceMappingURL=sale.service.spec.js.map
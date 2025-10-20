"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const reports_service_1 = require("./reports.service");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const generate_report_dto_1 = require("./dto/generate-report.dto");
const common_1 = require("@nestjs/common");
describe('ReportsService', () => {
    let service;
    let prismaService;
    const mockCompany = {
        id: 'company-1',
        name: 'Empresa Teste',
        cnpj: '00.000.000/0000-00',
        email: 'teste@empresa.com',
        phone: '(11) 99999-9999',
        stateRegistration: '123456789',
        municipalRegistration: '987654321',
    };
    const mockSales = [
        {
            id: 'sale-1',
            saleDate: new Date('2025-10-01'),
            total: 100,
            clientName: 'Cliente 1',
            clientCpfCnpj: '000.000.000-00',
            paymentMethod: ['cash'],
            change: 0,
            isInstallment: false,
            seller: {
                id: 'seller-1',
                name: 'Vendedor 1',
            },
            items: [
                {
                    product: {
                        name: 'Produto 1',
                        barcode: '123456',
                    },
                    quantity: 2,
                    unitPrice: 50,
                    totalPrice: 100,
                },
            ],
        },
    ];
    const mockPrismaService = {
        company: {
            findUnique: jest.fn(),
        },
        sale: {
            findMany: jest.fn(),
        },
        product: {
            findMany: jest.fn(),
        },
        fiscalDocument: {
            findMany: jest.fn(),
        },
        billToPay: {
            findMany: jest.fn(),
        },
        cashClosure: {
            findMany: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                reports_service_1.ReportsService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();
        service = module.get(reports_service_1.ReportsService);
        prismaService = module.get(prisma_service_1.PrismaService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('generateReport', () => {
        it('should throw NotFoundException if company does not exist', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue(null);
            await expect(service.generateReport('invalid-company', {
                reportType: generate_report_dto_1.ReportType.SALES,
                format: generate_report_dto_1.ReportFormat.JSON,
            })).rejects.toThrow(common_1.NotFoundException);
        });
        it('should generate sales report in JSON format', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue(mockCompany);
            mockPrismaService.sale.findMany.mockResolvedValue(mockSales);
            const result = await service.generateReport('company-1', {
                reportType: generate_report_dto_1.ReportType.SALES,
                format: generate_report_dto_1.ReportFormat.JSON,
            });
            expect(result.contentType).toBe('application/json');
            expect(result.data).toHaveProperty('company');
            expect(result.data).toHaveProperty('reportMetadata');
            expect(result.data).toHaveProperty('data');
            if (typeof result.data !== 'string' && !Buffer.isBuffer(result.data)) {
                expect(result.data.data).toHaveProperty('summary');
                expect(result.data.data).toHaveProperty('sales');
            }
        });
        it('should generate complete report in XML format', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue(mockCompany);
            mockPrismaService.sale.findMany.mockResolvedValue(mockSales);
            mockPrismaService.product.findMany.mockResolvedValue([]);
            mockPrismaService.fiscalDocument.findMany.mockResolvedValue([]);
            mockPrismaService.billToPay.findMany.mockResolvedValue([]);
            mockPrismaService.cashClosure.findMany.mockResolvedValue([]);
            const result = await service.generateReport('company-1', {
                reportType: generate_report_dto_1.ReportType.COMPLETE,
                format: generate_report_dto_1.ReportFormat.XML,
            });
            expect(result.contentType).toBe('application/xml');
            expect(typeof result.data).toBe('string');
            expect(result.data).toContain('<?xml');
            expect(result.data).toContain('<report>');
        });
        it('should generate products report in Excel format', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue(mockCompany);
            mockPrismaService.product.findMany.mockResolvedValue([
                {
                    id: 'product-1',
                    name: 'Produto Teste',
                    barcode: '123456',
                    category: 'Categoria 1',
                    price: 50,
                    stockQuantity: 10,
                    saleItems: [],
                },
            ]);
            const result = await service.generateReport('company-1', {
                reportType: generate_report_dto_1.ReportType.PRODUCTS,
                format: generate_report_dto_1.ReportFormat.EXCEL,
            });
            expect(result.contentType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            expect(result.data).toBeInstanceOf(Buffer);
        });
        it('should filter sales by date range', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue(mockCompany);
            mockPrismaService.sale.findMany.mockResolvedValue(mockSales);
            const startDate = '2025-10-01T00:00:00.000Z';
            const endDate = '2025-10-31T23:59:59.999Z';
            await service.generateReport('company-1', {
                reportType: generate_report_dto_1.ReportType.SALES,
                format: generate_report_dto_1.ReportFormat.JSON,
                startDate,
                endDate,
            });
            expect(mockPrismaService.sale.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    saleDate: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                }),
            }));
        });
        it('should filter sales by seller', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue(mockCompany);
            mockPrismaService.sale.findMany.mockResolvedValue(mockSales);
            const sellerId = 'seller-1';
            await service.generateReport('company-1', {
                reportType: generate_report_dto_1.ReportType.SALES,
                format: generate_report_dto_1.ReportFormat.JSON,
                sellerId,
            });
            expect(mockPrismaService.sale.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    sellerId,
                }),
            }));
        });
    });
    describe('generateSalesReport', () => {
        it('should calculate correct statistics', async () => {
            const sales = [
                { ...mockSales[0], total: 100 },
                { ...mockSales[0], id: 'sale-2', total: 200 },
                { ...mockSales[0], id: 'sale-3', total: 300 },
            ];
            mockPrismaService.sale.findMany.mockResolvedValue(sales);
            const result = await service['generateSalesReport']('company-1');
            expect(result.summary.totalSales).toBe(3);
            expect(result.summary.totalRevenue).toBe(600);
            expect(result.summary.averageTicket).toBe(200);
        });
    });
    describe('generateProductsReport', () => {
        it('should calculate product statistics', async () => {
            const products = [
                {
                    id: 'product-1',
                    name: 'Produto 1',
                    barcode: '123456',
                    category: 'Categoria 1',
                    price: 50,
                    stockQuantity: 10,
                    saleItems: [
                        { quantity: 5, totalPrice: 250 },
                        { quantity: 3, totalPrice: 150 },
                    ],
                },
            ];
            mockPrismaService.product.findMany.mockResolvedValue(products);
            const result = await service['generateProductsReport']('company-1');
            expect(result.products[0].totalSold).toBe(8);
            expect(result.products[0].totalRevenue).toBe(400);
            expect(result.summary.totalStockValue).toBe(500);
        });
    });
});
//# sourceMappingURL=reports.service.spec.js.map
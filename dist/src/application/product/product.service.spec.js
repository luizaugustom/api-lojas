"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const product_service_1 = require("./product.service");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const upload_service_1 = require("../upload/upload.service");
describe('ProductService', () => {
    let service;
    let prismaService;
    const mockPrismaService = {
        product: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            aggregate: jest.fn(),
        },
        saleItem: {
            count: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                product_service_1.ProductService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: upload_service_1.UploadService,
                    useValue: { deleteMultipleFiles: jest.fn(), deleteFile: jest.fn() },
                },
            ],
        }).compile();
        service = module.get(product_service_1.ProductService);
        prismaService = module.get(prisma_service_1.PrismaService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('create', () => {
        it('should create a product successfully', async () => {
            const createProductDto = {
                name: 'Test Product',
                barcode: '1234567890',
                stockQuantity: 100,
                price: 29.99,
                category: 'Test Category',
            };
            const mockProduct = {
                id: '1',
                ...createProductDto,
                companyId: 'company-1',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaService.product.create.mockResolvedValue(mockProduct);
            const result = await service.create('company-1', createProductDto);
            expect(result).toEqual(mockProduct);
            expect(mockPrismaService.product.create).toHaveBeenCalledWith({
                data: {
                    ...createProductDto,
                    companyId: 'company-1',
                },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
        });
        it('should throw ConflictException for duplicate barcode', async () => {
            const createProductDto = {
                name: 'Test Product',
                barcode: '1234567890',
                stockQuantity: 100,
                price: 29.99,
            };
            const error = new Error('Unique constraint failed');
            error.code = 'P2002';
            mockPrismaService.product.create.mockRejectedValue(error);
            await expect(service.create('company-1', createProductDto)).rejects.toThrow('Código de barras já está em uso');
        });
    });
    describe('findAll', () => {
        it('should return paginated products', async () => {
            const mockProducts = [
                {
                    id: '1',
                    name: 'Product 1',
                    barcode: '1234567890',
                    price: 29.99,
                    stockQuantity: 100,
                    company: { id: '1', name: 'Company 1' },
                },
                {
                    id: '2',
                    name: 'Product 2',
                    barcode: '0987654321',
                    price: 39.99,
                    stockQuantity: 50,
                    company: { id: '1', name: 'Company 1' },
                },
            ];
            mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
            mockPrismaService.product.count.mockResolvedValue(2);
            const result = await service.findAll('company-1', 1, 10);
            expect(result).toEqual({
                products: mockProducts,
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1,
            });
        });
        it('should filter products by search term', async () => {
            const mockProducts = [
                {
                    id: '1',
                    name: 'Test Product',
                    barcode: '1234567890',
                    price: 29.99,
                    stockQuantity: 100,
                    company: { id: '1', name: 'Company 1' },
                },
            ];
            mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
            mockPrismaService.product.count.mockResolvedValue(1);
            const result = await service.findAll('company-1', 1, 10, 'Test');
            expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
                where: {
                    companyId: 'company-1',
                    OR: [
                        { name: { contains: 'Test', mode: 'insensitive' } },
                        { barcode: { contains: 'Test' } },
                        { category: { contains: 'Test', mode: 'insensitive' } },
                    ],
                },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: 0,
                take: 10,
            });
        });
    });
    describe('findOne', () => {
        it('should return a product by id', async () => {
            const mockProduct = {
                id: '1',
                name: 'Test Product',
                barcode: '1234567890',
                price: 29.99,
                stockQuantity: 100,
                company: { id: '1', name: 'Company 1' },
                _count: { saleItems: 5 },
            };
            mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
            const result = await service.findOne('1', 'company-1');
            expect(result).toEqual(mockProduct);
            expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
                where: { id: '1', companyId: 'company-1' },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    _count: {
                        select: {
                            saleItems: true,
                        },
                    },
                },
            });
        });
        it('should throw NotFoundException for non-existent product', async () => {
            mockPrismaService.product.findUnique.mockResolvedValue(null);
            await expect(service.findOne('999', 'company-1')).rejects.toThrow('Produto não encontrado');
        });
    });
    describe('findByBarcode', () => {
        it('should return a product by barcode', async () => {
            const mockProduct = {
                id: '1',
                name: 'Test Product',
                barcode: '1234567890',
                price: 29.99,
                stockQuantity: 100,
                company: { id: '1', name: 'Company 1' },
                companyId: 'company-1',
            };
            mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
            const result = await service.findByBarcode('1234567890', 'company-1');
            expect(result).toEqual(mockProduct);
            expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith({
                where: { barcode: '1234567890', companyId: 'company-1' },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
        });
        it('should throw NotFoundException for non-existent barcode', async () => {
            mockPrismaService.product.findFirst.mockResolvedValue(null);
            await expect(service.findByBarcode('9999999999', 'company-1')).rejects.toThrow('Produto não encontrado');
        });
    });
    describe('update', () => {
        it('should update a product successfully', async () => {
            const updateProductDto = {
                name: 'Updated Product',
                price: 39.99,
            };
            const existingProduct = {
                id: '1',
                name: 'Test Product',
                barcode: '1234567890',
                price: 29.99,
                stockQuantity: 100,
                companyId: 'company-1',
            };
            const updatedProduct = {
                ...existingProduct,
                ...updateProductDto,
                company: { id: '1', name: 'Company 1' },
                companyId: 'company-1',
            };
            mockPrismaService.product.findUnique.mockResolvedValue(existingProduct);
            mockPrismaService.product.update.mockResolvedValue(updatedProduct);
            const result = await service.update('1', updateProductDto, 'company-1');
            expect(result).toEqual(updatedProduct);
            expect(mockPrismaService.product.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: updateProductDto,
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
        });
        it('should throw NotFoundException for non-existent product', async () => {
            mockPrismaService.product.findUnique.mockResolvedValue(null);
            const updateProductDto = {
                name: 'Updated Product',
            };
            await expect(service.update('999', updateProductDto, 'company-1')).rejects.toThrow('Produto não encontrado');
        });
    });
    describe('remove', () => {
        it('should delete a product successfully', async () => {
            const existingProduct = {
                id: '1',
                name: 'Test Product',
                barcode: '1234567890',
                price: 29.99,
                stockQuantity: 100,
                companyId: 'company-1',
            };
            mockPrismaService.product.findUnique.mockResolvedValue(existingProduct);
            mockPrismaService.saleItem.count.mockResolvedValue(0);
            mockPrismaService.product.delete.mockResolvedValue(existingProduct);
            const result = await service.remove('1', 'company-1');
            expect(result).toEqual({ message: 'Produto removido com sucesso' });
            expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
                where: { id: '1' },
            });
        });
        it('should throw BadRequestException if product has sales', async () => {
            const existingProduct = {
                id: '1',
                name: 'Test Product',
                barcode: '1234567890',
                price: 29.99,
                stockQuantity: 100,
            };
            mockPrismaService.product.findUnique.mockResolvedValue(existingProduct);
            mockPrismaService.saleItem.count.mockResolvedValue(5);
            await expect(service.remove('1', 'company-1')).rejects.toThrow('Não é possível excluir produto que possui vendas');
        });
    });
    describe('getLowStockProducts', () => {
        it('should return products with low stock', async () => {
            const mockProducts = [
                {
                    id: '1',
                    name: 'Low Stock Product',
                    barcode: '1234567890',
                    price: 29.99,
                    stockQuantity: 5,
                    company: { id: '1', name: 'Company 1' },
                },
            ];
            mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
            const result = await service.getLowStockProducts('company-1', 10);
            expect(result).toEqual(mockProducts);
            expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
                where: {
                    companyId: 'company-1',
                    stockQuantity: {
                        lte: 10,
                    },
                },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    stockQuantity: 'asc',
                },
            });
        });
    });
});
//# sourceMappingURL=product.service.spec.js.map
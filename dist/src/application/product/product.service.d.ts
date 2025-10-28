import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { UploadService } from '../upload/upload.service';
import { PlanLimitsService } from '../../shared/services/plan-limits.service';
import { ProductPhotoService } from './services/product-photo.service';
import { ProductPhotoValidationService } from './services/product-photo-validation.service';
export declare class ProductService {
    private readonly prisma;
    private readonly uploadService;
    private readonly planLimitsService;
    private readonly photoService;
    private readonly photoValidationService;
    private readonly logger;
    constructor(prisma: PrismaService, uploadService: UploadService, planLimitsService: PlanLimitsService, photoService: ProductPhotoService, photoValidationService: ProductPhotoValidationService);
    create(companyId: string, createProductDto: CreateProductDto): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        barcode: string;
        photos: string[];
        size: string | null;
        stockQuantity: number;
        price: import("@prisma/client/runtime/library").Decimal;
        category: string | null;
        expirationDate: Date | null;
        ncm: string | null;
        cfop: string | null;
    }>;
    createWithPhotos(companyId: string, createProductDto: CreateProductDto, photos: Express.Multer.File[]): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        barcode: string;
        photos: string[];
        size: string | null;
        stockQuantity: number;
        price: import("@prisma/client/runtime/library").Decimal;
        category: string | null;
        expirationDate: Date | null;
        ncm: string | null;
        cfop: string | null;
    }>;
    findAll(companyId?: string, page?: number, limit?: number, search?: string): Promise<{
        products: ({
            company: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            companyId: string;
            barcode: string;
            photos: string[];
            size: string | null;
            stockQuantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
            category: string | null;
            expirationDate: Date | null;
            ncm: string | null;
            cfop: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, companyId?: string): Promise<{
        company: {
            id: string;
            name: string;
        };
        _count: {
            saleItems: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        barcode: string;
        photos: string[];
        size: string | null;
        stockQuantity: number;
        price: import("@prisma/client/runtime/library").Decimal;
        category: string | null;
        expirationDate: Date | null;
        ncm: string | null;
        cfop: string | null;
    }>;
    findByBarcode(barcode: string, companyId?: string): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        barcode: string;
        photos: string[];
        size: string | null;
        stockQuantity: number;
        price: import("@prisma/client/runtime/library").Decimal;
        category: string | null;
        expirationDate: Date | null;
        ncm: string | null;
        cfop: string | null;
    }>;
    update(id: string, updateProductDto: UpdateProductDto, companyId?: string): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        barcode: string;
        photos: string[];
        size: string | null;
        stockQuantity: number;
        price: import("@prisma/client/runtime/library").Decimal;
        category: string | null;
        expirationDate: Date | null;
        ncm: string | null;
        cfop: string | null;
    }>;
    updateWithPhotos(id: string, companyId: string, updateProductDto: UpdateProductDto, newPhotos?: Express.Multer.File[], photosToDelete?: string[]): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        barcode: string;
        photos: string[];
        size: string | null;
        stockQuantity: number;
        price: import("@prisma/client/runtime/library").Decimal;
        category: string | null;
        expirationDate: Date | null;
        ncm: string | null;
        cfop: string | null;
    }>;
    remove(id: string, companyId?: string): Promise<{
        message: string;
    }>;
    updateStock(id: string, updateStockDto: UpdateStockDto, companyId?: string): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        barcode: string;
        photos: string[];
        size: string | null;
        stockQuantity: number;
        price: import("@prisma/client/runtime/library").Decimal;
        category: string | null;
        expirationDate: Date | null;
        ncm: string | null;
        cfop: string | null;
    }>;
    getLowStockProducts(companyId?: string, threshold?: number): Promise<({
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        barcode: string;
        photos: string[];
        size: string | null;
        stockQuantity: number;
        price: import("@prisma/client/runtime/library").Decimal;
        category: string | null;
        expirationDate: Date | null;
        ncm: string | null;
        cfop: string | null;
    })[]>;
    getExpiringProducts(companyId?: string, days?: number): Promise<({
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        barcode: string;
        photos: string[];
        size: string | null;
        stockQuantity: number;
        price: import("@prisma/client/runtime/library").Decimal;
        category: string | null;
        expirationDate: Date | null;
        ncm: string | null;
        cfop: string | null;
    })[]>;
    getProductStats(companyId?: string): Promise<{
        totalProducts: number;
        lowStockCount: number;
        expiringCount: number;
        totalStockQuantity: number;
    }>;
    getCategories(companyId?: string): Promise<string[]>;
    addPhoto(id: string, photoUrl: string, companyId?: string): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        barcode: string;
        photos: string[];
        size: string | null;
        stockQuantity: number;
        price: import("@prisma/client/runtime/library").Decimal;
        category: string | null;
        expirationDate: Date | null;
        ncm: string | null;
        cfop: string | null;
    }>;
    addPhotos(id: string, photoUrls: string[], companyId?: string): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        barcode: string;
        photos: string[];
        size: string | null;
        stockQuantity: number;
        price: import("@prisma/client/runtime/library").Decimal;
        category: string | null;
        expirationDate: Date | null;
        ncm: string | null;
        cfop: string | null;
    }>;
    removePhoto(id: string, photoUrl: string, companyId?: string): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        barcode: string;
        photos: string[];
        size: string | null;
        stockQuantity: number;
        price: import("@prisma/client/runtime/library").Decimal;
        category: string | null;
        expirationDate: Date | null;
        ncm: string | null;
        cfop: string | null;
    }>;
    removeAllPhotos(id: string, companyId?: string): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        barcode: string;
        photos: string[];
        size: string | null;
        stockQuantity: number;
        price: import("@prisma/client/runtime/library").Decimal;
        category: string | null;
        expirationDate: Date | null;
        ncm: string | null;
        cfop: string | null;
    }>;
}

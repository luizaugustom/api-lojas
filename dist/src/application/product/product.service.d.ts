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
    private normalizePhotos;
    private serializePhotos;
    create(companyId: string, createProductDto: CreateProductDto): Promise<any>;
    createWithPhotos(companyId: string, createProductDto: CreateProductDto, photos: Express.Multer.File[]): Promise<any>;
    findAll(companyId?: string, page?: number, limit?: number, search?: string): Promise<{
        products: {
            photos: string[];
            company: {
                id: string;
                name: string;
            };
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            companyId: string;
            barcode: string;
            size: string | null;
            stockQuantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
            category: string | null;
            expirationDate: Date | null;
            ncm: string | null;
            cfop: string | null;
            unitOfMeasure: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, companyId?: string): Promise<any>;
    findByBarcode(barcode: string, companyId?: string): Promise<any>;
    update(id: string, updateProductDto: UpdateProductDto, companyId?: string): Promise<any>;
    updateWithPhotos(id: string, companyId: string, updateProductDto: UpdateProductDto, newPhotos?: Express.Multer.File[], photosToDelete?: string[]): Promise<any>;
    remove(id: string, companyId?: string): Promise<{
        message: string;
    }>;
    updateStock(id: string, updateStockDto: UpdateStockDto, companyId?: string): Promise<any>;
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
        unitOfMeasure: string | null;
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
        unitOfMeasure: string | null;
    })[]>;
    getProductStats(companyId?: string): Promise<{
        totalProducts: number;
        lowStockCount: number;
        expiringCount: number;
        totalStockQuantity: number;
    }>;
    getCategories(companyId?: string): Promise<string[]>;
    addPhoto(id: string, photoUrl: string, companyId?: string): Promise<any>;
    addPhotos(id: string, photoUrls: string[], companyId?: string): Promise<any>;
    removePhoto(id: string, photoUrl: string, companyId?: string): Promise<any>;
    removeAllPhotos(id: string, companyId?: string): Promise<any>;
}

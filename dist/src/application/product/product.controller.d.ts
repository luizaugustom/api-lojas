import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { UploadService } from '../upload/upload.service';
export declare class ProductController {
    private readonly productService;
    private readonly uploadService;
    constructor(productService: ProductService, uploadService: UploadService);
    create(user: any, createProductDto: CreateProductDto): Promise<{
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
    }>;
    findAll(user: any, page?: number, limit?: number, search?: string): Promise<{
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
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStats(user: any): Promise<{
        totalProducts: number;
        lowStockCount: number;
        expiringCount: number;
        totalStockQuantity: number;
    }>;
    getLowStock(user: any, threshold?: number): Promise<({
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
    })[]>;
    getExpiring(user: any, days?: number): Promise<({
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
    })[]>;
    getCategories(user: any): Promise<string[]>;
    findByBarcode(barcode: string, user: any): Promise<{
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
    }>;
    findOne(id: string, user: any): Promise<{
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
    }>;
    update(id: string, updateProductDto: UpdateProductDto, user: any): Promise<{
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
    }>;
    updateStock(id: string, updateStockDto: UpdateStockDto, user: any): Promise<{
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
    }>;
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
    addPhoto(id: string, photo: Express.Multer.File, user: any): Promise<{
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
    }>;
    addPhotos(id: string, photos: Express.Multer.File[], user: any): Promise<{
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
    }>;
    removePhoto(id: string, photoUrl: string, user: any): Promise<{
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
    }>;
    removeAllPhotos(id: string, user: any): Promise<{
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
    }>;
    uploadPhotosAndCreate(photos: Express.Multer.File[], productData: any, user: any): Promise<{
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
    }>;
}

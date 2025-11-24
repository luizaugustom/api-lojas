import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { UploadService } from '../upload/upload.service';
export declare class ProductController {
    private readonly productService;
    private readonly uploadService;
    private readonly logger;
    constructor(productService: ProductService, uploadService: UploadService);
    create(user: any, createProductDto: CreateProductDto): Promise<any>;
    findAll(user: any, page?: number, limit?: number, search?: string): Promise<{
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
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
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
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        category: string | null;
        expirationDate: Date | null;
        ncm: string | null;
        cfop: string | null;
        unitOfMeasure: string | null;
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
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        category: string | null;
        expirationDate: Date | null;
        ncm: string | null;
        cfop: string | null;
        unitOfMeasure: string | null;
    })[]>;
    getCategories(user: any): Promise<string[]>;
    findByBarcode(barcode: string, user: any): Promise<any>;
    findOne(id: string, user: any): Promise<any>;
    update(id: string, updateProductDto: UpdateProductDto, user: any): Promise<any>;
    updateStock(id: string, updateStockDto: UpdateStockDto, user: any): Promise<any>;
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
    addPhoto(id: string, photo: Express.Multer.File, user: any): Promise<any>;
    addPhotos(id: string, photos: Express.Multer.File[], user: any): Promise<any>;
    removePhoto(id: string, photoUrl: string, user: any): Promise<any>;
    removeAllPhotos(id: string, user: any): Promise<any>;
    uploadPhotosAndCreate(photos: Express.Multer.File[], productData: any, user: any): Promise<any>;
    updateProductPhotos(id: string, newPhotos: Express.Multer.File[], photosToDelete: string | string[], user: any): Promise<any>;
    uploadPhotosAndUpdate(id: string, photos: Express.Multer.File[], productData: any, photosToDeleteBody: string | string[], user: any): Promise<any>;
}

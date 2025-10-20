import { PrismaService } from '../../infrastructure/database/prisma.service';
import { HashService } from '../../shared/services/hash.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
export declare class AdminService {
    private readonly prisma;
    private readonly hashService;
    private readonly logger;
    constructor(prisma: PrismaService, hashService: HashService);
    create(createAdminDto: CreateAdminDto): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            companies: number;
        };
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        companies: {
            id: string;
            createdAt: Date;
            name: string;
            cnpj: string;
            email: string;
        }[];
    }>;
    update(id: string, updateAdminDto: UpdateAdminDto): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}

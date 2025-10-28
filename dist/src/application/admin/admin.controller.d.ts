import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdateFocusNfeConfigDto } from './dto/update-focus-nfe-config.dto';
import { NotificationService } from '../notification/notification.service';
import { BroadcastNotificationDto } from '../notification/dto/broadcast-notification.dto';
export declare class AdminController {
    private readonly adminService;
    private readonly notificationService;
    constructor(adminService: AdminService, notificationService: NotificationService);
    create(createAdminDto: CreateAdminDto): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(page?: number, limit?: number): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            companies: number;
        };
    }[]>;
    updateFocusNfeConfig(user: any, updateFocusNfeConfigDto: UpdateFocusNfeConfigDto): Promise<{
        message: string;
        id: string;
        login: string;
        focusNfeEnvironment: string;
    }>;
    getFocusNfeConfig(user: any): Promise<{
        id: string;
        login: string;
        focusNfeApiKey: string;
        hasFocusNfeApiKey: boolean;
        focusNfeEnvironment: string;
        ibptToken: string;
        hasIbptToken: boolean;
    }>;
    broadcastNotification(broadcastDto: BroadcastNotificationDto): Promise<{
        message: string;
        count: number;
        target: "companies" | "sellers" | "all";
    }>;
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

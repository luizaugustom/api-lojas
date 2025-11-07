import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class AuthController {
    private readonly authService;
    private readonly logger;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, res: Response): Promise<any>;
    refresh(req: Request, res: Response): Promise<{
        access_token: string;
        user: {
            id: any;
            login: any;
            role: string;
            companyId: string;
            name: any;
            plan: string;
            dataPeriod: import(".prisma/client").$Enums.DataPeriodFilter;
        };
    }>;
    logout(req: Request, res: Response): Promise<{
        message: string;
    }>;
    getProfile(req: any): Promise<any>;
    updateProfile(req: any, updateProfileDto: UpdateProfileDto): Promise<any>;
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}

import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
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
        };
    }>;
    logout(req: Request, res: Response): Promise<{
        message: string;
    }>;
}

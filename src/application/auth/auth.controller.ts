import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from '../../shared/decorators/public.decorator';
import { AuthService, LoginResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realizar login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            login: { type: 'string' },
            role: { type: 'string' },
            companyId: { type: 'string', nullable: true },
            name: { type: 'string', nullable: true },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<any> {
    this.logger.log(`Login attempt for user: ${loginDto.login}`);
    const result: any = await this.authService.login(loginDto);

    // set refresh token as httpOnly cookie
    const refreshToken = result.refresh_token;
    if (refreshToken) {
      const cookieOptions: any = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: Number(process.env.REFRESH_TOKEN_MAX_AGE_MS) || 30 * 24 * 60 * 60 * 1000, // 30 days
      };
      res.cookie('refresh_token', refreshToken, cookieOptions);
    }

    // set access_token optionally as httpOnly cookie as well (optional)
    if (result.access_token) {
      const accessCookieOptions: any = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: Number(process.env.ACCESS_TOKEN_MAX_AGE_MS) || 15 * 60 * 1000, // 15m
      };
      res.cookie('access_token', result.access_token, accessCookieOptions);
    }

    // return access token and user
    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    const result = await this.authService.refresh(refreshToken);

    // update cookie with new refresh token
    if (result.refresh_token) {
      const cookieOptions: any = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: Number(process.env.REFRESH_TOKEN_MAX_AGE_MS) || 30 * 24 * 60 * 60 * 1000,
      };
      res.cookie('refresh_token', result.refresh_token, cookieOptions);
    }

    // also set new access_token cookie
    if (result.access_token) {
      const accessCookieOptions: any = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: Number(process.env.ACCESS_TOKEN_MAX_AGE_MS) || 15 * 60 * 1000,
      };
      res.cookie('access_token', result.access_token, accessCookieOptions);
    }

    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
      res.clearCookie('refresh_token');
    }
    res.clearCookie('access_token');
    return { message: 'Logged out' };
  }
}

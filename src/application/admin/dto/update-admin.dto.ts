import { PartialType, OmitType } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';
import { CreateAdminDto } from './create-admin.dto';

export class UpdateAdminDto extends PartialType(
  OmitType(CreateAdminDto, ['password'] as const)
) {
  @IsOptional()
  @IsString()
  @MinLength(6, {
    message: 'A senha deve ter no mínimo 6 caracteres'
  })
  password?: string;
}

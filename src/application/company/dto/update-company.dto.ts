import { PartialType, OmitType } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsEmail } from 'class-validator';
import { CreateCompanyDto } from './create-company.dto';

export class UpdateCompanyDto extends PartialType(
  OmitType(CreateCompanyDto, ['password'] as const)
) {
  @IsOptional()
  @IsString()
  @IsEmail()
  login?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, {
    message: 'A senha deve ter no mínimo 6 caracteres'
  })
  password?: string;
}

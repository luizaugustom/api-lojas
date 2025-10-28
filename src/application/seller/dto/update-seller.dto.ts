import { PartialType, OmitType } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';
import { CreateSellerDto } from './create-seller.dto';

export class UpdateSellerDto extends PartialType(
  OmitType(CreateSellerDto, ['password'] as const)
) {
  @IsOptional()
  @IsString()
  @MinLength(6, {
    message: 'A senha deve ter no mínimo 6 caracteres'
  })
  password?: string;
}

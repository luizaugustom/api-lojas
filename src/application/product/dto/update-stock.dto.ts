import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStockDto {
  @ApiProperty({
    description: 'Nova quantidade em estoque',
    example: 150,
    minimum: 0,
  })
  @IsNumber()
  @IsPositive()
  @Min(0)
  @Type(() => Number)
  stockQuantity: number;
}

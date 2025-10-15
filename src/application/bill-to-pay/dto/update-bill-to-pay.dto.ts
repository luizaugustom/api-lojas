import { PartialType } from '@nestjs/swagger';
import { CreateBillToPayDto } from './create-bill-to-pay.dto';

export class UpdateBillToPayDto extends PartialType(CreateBillToPayDto) {}

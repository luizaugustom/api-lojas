import { CreateSellerDto } from './create-seller.dto';
declare const UpdateSellerDto_base: import("@nestjs/common").Type<Partial<Omit<CreateSellerDto, "password">>>;
export declare class UpdateSellerDto extends UpdateSellerDto_base {
    password?: string;
}
export {};

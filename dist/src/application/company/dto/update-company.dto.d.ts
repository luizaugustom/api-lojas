import { CreateCompanyDto } from './create-company.dto';
declare const UpdateCompanyDto_base: import("@nestjs/common").Type<Partial<Omit<CreateCompanyDto, "password">>>;
export declare class UpdateCompanyDto extends UpdateCompanyDto_base {
    login?: string;
    password?: string;
}
export {};

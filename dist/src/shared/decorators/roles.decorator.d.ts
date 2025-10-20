export declare enum UserRole {
    ADMIN = "admin",
    COMPANY = "company",
    SELLER = "seller"
}
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: UserRole[]) => import("@nestjs/common").CustomDecorator<string>;

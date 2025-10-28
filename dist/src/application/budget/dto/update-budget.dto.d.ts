export declare enum BudgetStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    EXPIRED = "expired"
}
export declare class UpdateBudgetDto {
    status?: BudgetStatus;
    notes?: string;
}

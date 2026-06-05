export interface CalculationResults {
  securityDeposit: number;
  petDeposit: number;
  fullMonthRent: number;
  proRatedRent: number;
  prePaymentRent: number;
  totalPrePayment: number;
}

export interface ManagementFeeResults {
  managementFee: number;
  managementFeeGST: number;
  managementFeeTotal: number;
}

export interface TenantFeeResults {
  tenantPlacementFee: number;
  tenantPlacementFeeGST: number;
  tenantPlacementFeeTotal: number;
}


"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalculationResults, ManagementFeeResults, TenantFeeResults } from "@/types";
export default function RentCalculator() {
  const [monthlyRent, setMonthlyRent] = useState<string>("");
  const [moveInDate, setMoveInDate] = useState<Date>();
  const [moveInDateOpen, setMoveInDateOpen] = useState<boolean>(false);
  const [fullMonthRent, setFullMonthRent] = useState<boolean>(false);
  const [proRataRent, setProRataRent] = useState<boolean>(false);
  const [prePaymentRent, setPrePaymentRent] = useState<boolean>(false);
  const [monthsOfPrePayment, setMonthsOfPrePayment] = useState<string>("1");
  const [securityDepositEnabled, setSecurityDepositEnabled] = useState<boolean>(true);
  const [petDepositEnabled, setPetDepositEnabled] = useState<boolean>(true);

  // Management fee states
  const [feeType, setFeeType] = useState<string>("not-applicable");
  const [feePercentage, setFeePercentage] = useState<string>("");
  const [minimumFee, setMinimumFee] = useState<string>("");
  const [overrideFee, setOverrideFee] = useState<string>("");

  // Tenant placement fee states
  const [tenantFeeType, setTenantFeeType] = useState<string>("not-applicable");
  const [tenantFeePercentage, setTenantFeePercentage] = useState<string>("");
  const [tenantMinimumFee, setTenantMinimumFee] = useState<string>("1500");
  const [tenantFixedFee, setTenantFixedFee] = useState<string>("");

  const [results, setResults] = useState<CalculationResults>({
    securityDeposit: 0,
    petDeposit: 0,
    fullMonthRent: 0,
    proRatedRent: 0,
    prePaymentRent: 0,
    totalPrePayment: 0,
  });

  const [managementFeeResults, setManagementFeeResults] = useState<ManagementFeeResults>({
    managementFee: 0,
    managementFeeGST: 0,
    managementFeeTotal: 0,
  });

  const [tenantFeeResults, setTenantFeeResults] = useState<TenantFeeResults>({
    tenantPlacementFee: 0,
    tenantPlacementFeeGST: 0,
    tenantPlacementFeeTotal: 0,
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleRentChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    setMonthlyRent(numericValue);
  };

  const calculateResults = () => {
    const rent = parseFloat(monthlyRent);

    if (!rent) {
      setResults({
        securityDeposit: 0,
        petDeposit: 0,
        fullMonthRent: 0,
        proRatedRent: 0,
        prePaymentRent: 0,
        totalPrePayment: 0,
      });
      return;
    }

    // Calculate security and pet deposits (50% of monthly rent each) only if enabled
    const securityDeposit = securityDepositEnabled ? rent / 2 : 0;
    const petDeposit = petDepositEnabled ? rent / 2 : 0;

    // Calculate full month rent
    const fullMonthRentAmount = fullMonthRent ? rent : 0;

    // Calculate pro-rated rent
    let proRatedRentAmount = 0;
    if (proRataRent && moveInDate) {
      const year = moveInDate.getFullYear();
      const month = moveInDate.getMonth();
      const dayOfMonth = moveInDate.getDate();

      const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
      const remainingDays = totalDaysInMonth - dayOfMonth + 1;

      proRatedRentAmount = (remainingDays / totalDaysInMonth) * rent;
    }

    // Calculate pre-payment rent
    const prePaymentMonths = parseFloat(monthsOfPrePayment) || 0;
    const prePaymentRentAmount = prePaymentRent ? rent * prePaymentMonths : 0;

    // Calculate total pre-payment
    const totalPrePayment = securityDeposit + petDeposit + fullMonthRentAmount + proRatedRentAmount + prePaymentRentAmount;

    setResults({
      securityDeposit,
      petDeposit,
      fullMonthRent: fullMonthRentAmount,
      proRatedRent: proRatedRentAmount,
      prePaymentRent: prePaymentRentAmount,
      totalPrePayment,
    });
  };

  const calculateManagementFee = () => {
    const rent = parseFloat(monthlyRent);

    if (!rent || feeType === "not-applicable") {
      setManagementFeeResults({ managementFee: 0, managementFeeGST: 0, managementFeeTotal: 0 });
      return;
    }

    let managementFee = 0;

    if (feeType === "percentage") {
      const percentage = parseFloat(feePercentage) || 0;
      const minFee = parseFloat(minimumFee) || 0;
      const calculatedFee = (percentage / 100) * rent;

      // Use calculated value if it's greater than minimum fee, otherwise use minimum fee
      managementFee = calculatedFee >= minFee ? calculatedFee : minFee;
    } else if (feeType === "fixed") {
      managementFee = parseFloat(overrideFee) || 0;
    }

    const managementFeeGST = managementFee * 0.05;
    setManagementFeeResults({ managementFee, managementFeeGST, managementFeeTotal: managementFee + managementFeeGST });
  };

  const calculateTenantPlacementFee = () => {
    const rent = parseFloat(monthlyRent);

    if (!rent || tenantFeeType === "not-applicable") {
      setTenantFeeResults({ tenantPlacementFee: 0, tenantPlacementFeeGST: 0, tenantPlacementFeeTotal: 0 });
      return;
    }

    let tenantPlacementFee = 0;

    if (tenantFeeType === "percentage") {
      const percentage = parseFloat(tenantFeePercentage) || 0;
      const minFee = parseFloat(tenantMinimumFee) || 1500;
      const calculatedFee = (percentage / 100) * rent;

      // Use the greater of calculated fee or minimum fee
      tenantPlacementFee = Math.max(calculatedFee, minFee);
    } else if (tenantFeeType === "fixed") {
      tenantPlacementFee = parseFloat(tenantFixedFee) || 0;
    }

    const tenantPlacementFeeGST = tenantPlacementFee * 0.05;
    setTenantFeeResults({ tenantPlacementFee, tenantPlacementFeeGST, tenantPlacementFeeTotal: tenantPlacementFee + tenantPlacementFeeGST });
  };

  useEffect(() => {
    calculateResults();
  }, [monthlyRent, moveInDate, fullMonthRent, proRataRent, prePaymentRent, monthsOfPrePayment, securityDepositEnabled, petDepositEnabled]);

  useEffect(() => {
    calculateManagementFee();
  }, [monthlyRent, feeType, feePercentage, minimumFee, overrideFee]);

  useEffect(() => {
    calculateTenantPlacementFee();
  }, [monthlyRent, tenantFeeType, tenantFeePercentage, tenantMinimumFee, tenantFixedFee]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            New Tenant or Lease
          </h1>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Input Section */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Lease Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Monthly Rent Input */}
              <div className="space-y-2">
                <Label htmlFor="monthly-rent" className="text-sm">
                  Monthly Rent
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="monthly-rent"
                    type="text"
                    placeholder="0"
                    value={monthlyRent}
                    onChange={(e) => handleRentChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Move-in Date Input */}
              <div className="space-y-2">
                <Label className="text-sm">Move-in Date</Label>
                <Popover open={moveInDateOpen} onOpenChange={setMoveInDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !moveInDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {moveInDate ? format(moveInDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={moveInDate}
                      onSelect={(date) => {
                        setMoveInDate(date)
                        setMoveInDateOpen(false)
                      }}
                      captionLayout="dropdown"
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Security Deposit Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="security-deposit" className="text-sm">
                  Security Deposit
                </Label>
                <Switch
                  id="security-deposit"
                  checked={securityDepositEnabled}
                  onCheckedChange={setSecurityDepositEnabled}
                />
              </div>

              {/* Pet Deposit Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="pet-deposit" className="text-sm">
                  Pet Deposit
                </Label>
                <Switch
                  id="pet-deposit"
                  checked={petDepositEnabled}
                  onCheckedChange={setPetDepositEnabled}
                />
              </div>

              {/* Full Month Rent Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="full-month-rent" className="text-sm">
                  Full Month Rent
                </Label>
                <Switch
                  id="full-month-rent"
                  checked={fullMonthRent}
                  onCheckedChange={setFullMonthRent}
                />
              </div>

              {/* Pro-rata Rent Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="pro-rata-rent" className="text-sm">
                  Pro-rata Rent
                </Label>
                <Switch
                  id="pro-rata-rent"
                  checked={proRataRent}
                  onCheckedChange={setProRataRent}
                />
              </div>

              {/* Pre-payment Rent Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="pre-payment-rent" className="text-sm">
                  Pre-payment Rent
                </Label>
                <Switch
                  id="pre-payment-rent"
                  checked={prePaymentRent}
                  onCheckedChange={setPrePaymentRent}
                />
              </div>

              {/* Months of Pre-payment Input */}
              {prePaymentRent && (
                <div className="space-y-2">
                  <Label htmlFor="months-prepayment" className="text-sm">
                    Months of Pre-payment
                  </Label>
                  <Input
                    id="months-prepayment"
                    type="number"
                    min="1"
                    value={monthsOfPrePayment}
                    onChange={(e) => setMonthsOfPrePayment(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Breakdown of tenant's payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Security Deposit */}
              {securityDepositEnabled && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-700">Security Deposit</span>
                  <span className="font-medium">
                    {formatCurrency(results.securityDeposit)}
                  </span>
                </div>
              )}

              {/* Pet Deposit */}
              {petDepositEnabled && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-700">Pet Deposit</span>
                  <span className="font-medium">
                    {formatCurrency(results.petDeposit)}
                  </span>
                </div>
              )}

              {/* Full Month Rent */}
              {fullMonthRent && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-700">Full Month Rent</span>
                  <span className="font-medium">
                    {formatCurrency(results.fullMonthRent)}
                  </span>
                </div>
              )}

              {/* First month pro-rata rent */}
              {proRataRent && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-700">First month pro-rata rent</span>
                  <span className="font-medium">
                    {formatCurrency(results.proRatedRent)}
                  </span>
                </div>
              )}

              {/* Pre-payment Rent */}
              {prePaymentRent && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-700">Pre-payment Rent</span>
                  <span className="font-medium">
                    {formatCurrency(results.prePaymentRent)}
                  </span>
                </div>
              )}

              {/* Total Pre-payment */}
              <div className="flex justify-between items-center pt-3  ">
                <span className="font-medium text-gray-900">Total Pre-payment</span>
                <span className="text-lg font-bold">
                  {formatCurrency(results.totalPrePayment)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Management Fee Section */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                Management Fee
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fee Type Dropdown */}
              <div className="space-y-2">
                <Label className="text-sm">Fee Type</Label>
                <Select value={feeType} onValueChange={setFeeType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-applicable">Not Applicable</SelectItem>
                    <SelectItem value="percentage">% Basis</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fee Percentage Input */}
              {feeType === "percentage" && (
                <div className="space-y-2">
                  <Label htmlFor="fee-percentage" className="text-sm">
                    Fee Percentage (%)
                  </Label>
                  <Input
                    id="fee-percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={feePercentage}
                    onChange={(e) => setFeePercentage(e.target.value)}
                  />
                </div>
              )}

              {/* Minimum Fee Input */}
              {feeType === "percentage" && (
                <div className="space-y-2">
                  <Label htmlFor="minimum-fee" className="text-sm">
                    Minimum Fee
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="minimum-fee"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={minimumFee}
                      onChange={(e) => setMinimumFee(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {/* Override Fee Input */}
              {feeType === "fixed" && (
                <div className="space-y-2">
                  <Label htmlFor="override-fee" className="text-sm">
                    Override Fee
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="override-fee"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={overrideFee}
                      onChange={(e) => setOverrideFee(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {/* Management Fee Result */}
              {feeType !== "not-applicable" && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Management Fee</span>
                    <span>{formatCurrency(managementFeeResults.managementFee)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>GST (5%)</span>
                    <span>{formatCurrency(managementFeeResults.managementFeeGST)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-gray-900">Total</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(managementFeeResults.managementFeeTotal)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tenant Placement Fee Section */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                Tenant Placement Fee
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fee Type Dropdown */}
              <div className="space-y-2">
                <Label className="text-sm">Fee Type</Label>
                <Select value={tenantFeeType} onValueChange={setTenantFeeType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-applicable">Not Applicable</SelectItem>
                    <SelectItem value="percentage">% Basis</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fee Percentage Input */}
              {tenantFeeType === "percentage" && (
                <div className="space-y-2">
                  <Label htmlFor="tenant-fee-percentage" className="text-sm">
                    % of Rent
                  </Label>
                  <Input
                    id="tenant-fee-percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={tenantFeePercentage}
                    onChange={(e) => setTenantFeePercentage(e.target.value)}
                  />
                </div>
              )}

              {/* Minimum Fee Input */}
              {tenantFeeType === "percentage" && (
                <div className="space-y-2">
                  <Label htmlFor="tenant-minimum-fee" className="text-sm">
                    Minimum Fee
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="tenant-minimum-fee"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="1500"
                      value={tenantMinimumFee}
                      onChange={(e) => setTenantMinimumFee(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {/* Fixed Fee Input */}
              {tenantFeeType === "fixed" && (
                <div className="space-y-2">
                  <Label htmlFor="tenant-fixed-fee" className="text-sm">
                    Fixed Fee
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="tenant-fixed-fee"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={tenantFixedFee}
                      onChange={(e) => setTenantFixedFee(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {/* Tenant Placement Fee Result */}
              {tenantFeeType !== "not-applicable" && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Tenant Placement Fee</span>
                    <span>{formatCurrency(tenantFeeResults.tenantPlacementFee)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>GST (5%)</span>
                    <span>{formatCurrency(tenantFeeResults.tenantPlacementFeeGST)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-gray-900">Total</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(tenantFeeResults.tenantPlacementFeeTotal)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
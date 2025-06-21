"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Calculator, Home, DollarSign, Settings } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CalculationResults {
  securityDeposit: number;
  petDeposit: number;
  fullMonthRent: number;
  proRatedRent: number;
  prePaymentRent: number;
  totalPrePayment: number;
}

interface ManagementFeeResults {
  managementFee: number;
}

export default function RentCalculator() {
  const [monthlyRent, setMonthlyRent] = useState<string>("");
  const [moveInDate, setMoveInDate] = useState<Date>();
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
      setManagementFeeResults({ managementFee: 0 });
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

    setManagementFeeResults({ managementFee });
  };

  useEffect(() => {
    calculateResults();
  }, [monthlyRent, moveInDate, fullMonthRent, proRataRent, prePaymentRent, monthsOfPrePayment, securityDepositEnabled, petDepositEnabled]);

  useEffect(() => {
    calculateManagementFee();
  }, [monthlyRent, feeType, feePercentage, minimumFee, overrideFee]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Rent Calculator
          </h1>
          <p className="text-gray-600">
            Calculate your move-in costs and management fees
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Property Details</CardTitle>
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
                    placeholder="2,500.00"
                    value={monthlyRent}
                    onChange={(e) => handleRentChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Move-in Date Input */}
              <div className="space-y-2">
                <Label className="text-sm">Move-in Date</Label>
                <Popover>
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
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={moveInDate}
                      onSelect={setMoveInDate}
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

          {/* Management Fee Section */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-4 w-4" />
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
                    placeholder="10.00"
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
                      placeholder="100.00"
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
                      placeholder="250.00"
                      value={overrideFee}
                      onChange={(e) => setOverrideFee(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {/* Management Fee Result */}
              {feeType !== "not-applicable" && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-gray-900">Management Fee</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(managementFeeResults.managementFee)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Move-in Costs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Security Deposit */}
              {securityDepositEnabled && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-700">Security Deposit</span>
                  <span className="font-medium">
                    {formatCurrency(results.securityDeposit)}
                  </span>
                </div>
              )}
              
              {/* Pet Deposit */}
              {petDepositEnabled && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-700">Pet Deposit</span>
                  <span className="font-medium">
                    {formatCurrency(results.petDeposit)}
                  </span>
                </div>
              )}

              {/* Full Month Rent */}
              {fullMonthRent && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-700">Full Month Rent</span>
                  <span className="font-medium">
                    {formatCurrency(results.fullMonthRent)}
                  </span>
                </div>
              )}
              
              {/* First month pro-rata rent */}
              {proRataRent && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-700">First month pro-rata rent</span>
                  <span className="font-medium">
                    {formatCurrency(results.proRatedRent)}
                  </span>
                </div>
              )}

              {/* Pre-payment Rent */}
              {prePaymentRent && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-700">Pre-payment Rent</span>
                  <span className="font-medium">
                    {formatCurrency(results.prePaymentRent)}
                  </span>
                </div>
              )}

              {/* Total Pre-payment */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="font-medium text-gray-900">Total Pre-payment</span>
                <span className="text-lg font-bold">
                  {formatCurrency(results.totalPrePayment)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
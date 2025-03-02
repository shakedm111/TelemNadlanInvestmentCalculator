/**
 * Financial calculation utilities for real estate investment analysis
 */

// Calculate annual yield
export function calculateYield(price: number, annualRent: number): number {
  if (price <= 0) return 0;
  return (annualRent / price) * 100;
}

// Calculate monthly mortgage payment
export function calculateMortgagePayment(
  principal: number,
  annualInterestRate: number,
  termInYears: number
): number {
  if (principal <= 0 || annualInterestRate <= 0 || termInYears <= 0) return 0;
  
  const monthlyRate = annualInterestRate / 100 / 12;
  const numberOfPayments = termInYears * 12;
  
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  );
}

// Calculate total interest paid over loan term
export function calculateTotalInterest(
  principal: number,
  annualInterestRate: number,
  termInYears: number
): number {
  const monthlyPayment = calculateMortgagePayment(principal, annualInterestRate, termInYears);
  const totalPaid = monthlyPayment * termInYears * 12;
  return totalPaid - principal;
}

// Calculate cash flow
export function calculateCashFlow(
  monthlyRent: number,
  mortgagePayment: number,
  managementFee: number,
  otherExpenses: number
): number {
  return monthlyRent - mortgagePayment - managementFee - otherExpenses;
}

// Calculate return on investment (ROI)
export function calculateROI(
  annualCashFlow: number,
  initialInvestment: number
): number {
  if (initialInvestment <= 0) return 0;
  return (annualCashFlow / initialInvestment) * 100;
}

// Calculate payback period in years
export function calculatePaybackPeriod(
  initialInvestment: number,
  annualCashFlow: number
): number {
  if (annualCashFlow <= 0) return 0;
  return initialInvestment / annualCashFlow;
}

// Calculate capitalization rate (Cap Rate)
export function calculateCapRate(
  annualNetOperatingIncome: number,
  propertyValue: number
): number {
  if (propertyValue <= 0) return 0;
  return (annualNetOperatingIncome / propertyValue) * 100;
}

// Calculate cash-on-cash return
export function calculateCashOnCashReturn(
  annualPreTaxCashFlow: number,
  totalCashInvested: number
): number {
  if (totalCashInvested <= 0) return 0;
  return (annualPreTaxCashFlow / totalCashInvested) * 100;
}

// Calculate gross rent multiplier (GRM)
export function calculateGRM(
  propertyValue: number,
  annualGrossRent: number
): number {
  if (annualGrossRent <= 0) return 0;
  return propertyValue / annualGrossRent;
}

// Calculate debt service coverage ratio (DSCR)
export function calculateDSCR(
  annualNetOperatingIncome: number,
  annualDebtService: number
): number {
  if (annualDebtService <= 0) return 0;
  return annualNetOperatingIncome / annualDebtService;
}

// Calculate loan-to-value ratio (LTV)
export function calculateLTV(
  loanAmount: number,
  propertyValue: number
): number {
  if (propertyValue <= 0) return 0;
  return (loanAmount / propertyValue) * 100;
}

// Calculate property price in local currency
export function calculatePriceInLocalCurrency(
  priceInEuro: number,
  exchangeRate: number
): number {
  return priceInEuro * exchangeRate;
}

// Calculate price with VAT
export function calculatePriceWithVAT(
  priceWithoutVAT: number,
  vatRate: number
): number {
  return priceWithoutVAT * (1 + vatRate);
}

// Calculate monthly management fee
export function calculateManagementFee(
  monthlyRent: number,
  managementFeePercentage: number
): number {
  return monthlyRent * (managementFeePercentage / 100);
}

// Calculate mortgage amortization schedule
export function calculateAmortizationSchedule(
  principal: number,
  annualInterestRate: number,
  termInYears: number
): Array<{
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}> {
  const schedule = [];
  const monthlyRate = annualInterestRate / 100 / 12;
  const numberOfPayments = termInYears * 12;
  const monthlyPayment = calculateMortgagePayment(
    principal,
    annualInterestRate,
    termInYears
  );
  
  let balance = principal;
  
  for (let i = 1; i <= numberOfPayments; i++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;
    
    schedule.push({
      period: i,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: balance > 0 ? balance : 0,
    });
    
    if (balance <= 0) {
      break;
    }
  }
  
  return schedule;
}

// Generate sensitivity analysis data
export function generateSensitivityAnalysis(
  baseValue: number,
  parameter: string,
  rangePercentage: number = 20,
  steps: number = 5
): Array<{ parameter: string; value: number; result: number }> {
  const results = [];
  const stepSize = (rangePercentage * 2) / steps;
  
  for (let i = 0; i <= steps; i++) {
    const percentage = -rangePercentage + i * stepSize;
    const value = baseValue * (1 + percentage / 100);
    
    results.push({
      parameter,
      value,
      percentage,
      // The result needs to be calculated based on the specific analysis
      // This will be implemented by the calling function
      result: 0,
    });
  }
  
  return results;
}

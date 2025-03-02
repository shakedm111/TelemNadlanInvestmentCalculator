import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = "ILS",
  locale: string = "he-IL"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(
  number: number,
  locale: string = "he-IL",
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(locale, options).format(number);
}

export function formatDate(
  date: Date | string | number,
  locale: string = "he-IL",
  options: Intl.DateTimeFormatOptions = { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric" 
  }
): string {
  return new Intl.DateTimeFormat(locale, options).format(
    typeof date === "string" || typeof date === "number" 
      ? new Date(date) 
      : date
  );
}

export function calculateYield(
  annualRent: number,
  propertyPrice: number
): number {
  if (propertyPrice === 0) return 0;
  return (annualRent / propertyPrice) * 100;
}

export function calculateMortgagePayment(
  principal: number,
  annualInterestRate: number,
  termInYears: number
): number {
  if (principal === 0 || annualInterestRate === 0 || termInYears === 0) return 0;
  
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const numberOfPayments = termInYears * 12;
  
  return (
    (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)
  );
}

export function calculateTotalInterest(
  principal: number,
  monthlyPayment: number,
  termInYears: number
): number {
  const totalPayments = monthlyPayment * termInYears * 12;
  return totalPayments - principal;
}

export function calculateROI(
  totalProfit: number,
  totalInvestment: number
): number {
  if (totalInvestment === 0) return 0;
  return (totalProfit / totalInvestment) * 100;
}

export function calculateBreakEvenPoint(
  totalInvestment: number,
  monthlyProfit: number
): number {
  if (monthlyProfit === 0) return 0;
  return totalInvestment / monthlyProfit;
}

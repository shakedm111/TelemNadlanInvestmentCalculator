import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertAnalysisSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardProps,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Investment } from '@shared/schema';
import { 
  calculateMortgagePayment, 
  calculateLTV, 
  calculateCashFlow, 
  calculateROI, 
  calculatePaybackPeriod 
} from '@/lib/financial';
import { formatCurrency, formatPercentage } from '@/lib/utils';

// Define the different analysis types
const analysisTypes = [
  { value: 'mortgage', label: 'ניתוח משכנתא' },
  { value: 'cashflow', label: 'ניתוח תזרים מזומנים' },
  { value: 'sensitivity', label: 'ניתוח רגישות' },
  { value: 'comparison', label: 'ניתוח השוואתי' },
  { value: 'yield', label: 'ניתוח תשואה' },
];

// Type-specific parameter schemas
const mortgageParametersSchema = z.object({
  loanAmount: z.number().min(1, "יש להזין סכום הלוואה גדול מ-0"),
  interestRate: z.number().min(0.1, "יש להזין ריבית גדולה מ-0"),
  loanTerm: z.number().int().min(1, "יש להזין תקופת הלוואה חיובית"),
  loanType: z.enum(["israel", "cyprus"]),
});

const cashflowParametersSchema = z.object({
  period: z.number().int().min(1, "תקופה חייבת להיות חיובית"),
  initialInvestment: z.number().min(1, "השקעה התחלתית חייבת להיות חיובית"),
  monthlyRent: z.number().min(1, "שכירות חודשית חייבת להיות חיובית"),
  mortgagePayment: z.number().default(0),
  managementFee: z.number().default(0),
  propertyTax: z.number().default(0),
  insurance: z.number().default(0),
  maintenance: z.number().default(0),
  otherExpenses: z.number().default(0),
  annualAppreciation: z.number().default(0),
  annualRentIncrease: z.number().default(0),
});

const sensitivityParametersSchema = z.object({
  baseParameter: z.string(),
  baseValue: z.number().min(1, "ערך בסיס חייב להיות חיובי"),
  rangePercentage: z.number().min(1, "טווח אחוזים חייב להיות חיובי"),
  steps: z.number().int().min(3, "מספר צעדים מינימלי הוא 3"),
  affectedParameter: z.string(),
});

const comparisonParametersSchema = z.object({
  investmentIds: z.array(z.number()).min(2, "יש לבחור לפחות שתי אפשרויות להשוואה"),
  parameters: z.array(z.string()).min(1, "יש לבחור לפחות פרמטר אחד להשוואה"),
});

const yieldParametersSchema = z.object({
  purchasePrice: z.number().min(1, "מחיר רכישה חייב להיות חיובי"),
  closingCosts: z.number().default(0),
  renovationCosts: z.number().default(0),
  monthlyRent: z.number().min(1, "שכירות חודשית חייבת להיות חיובית"),
  vacancyRate: z.number().min(0).max(100, "שיעור תפוסה חייב להיות בין 0 ל-100"),
  expenseRate: z.number().min(0).max(100, "שיעור הוצאות חייב להיות בין 0 ל-100"),
});

// Extend the insertAnalysisSchema with additional validations
const analysisFormSchema = insertAnalysisSchema.extend({
  name: z.string().min(1, "יש להזין שם לניתוח"),
  type: z.enum(["mortgage", "cashflow", "sensitivity", "comparison", "yield"]),
  investmentId: z.number().nullable().optional(),
});

type AnalysisFormValues = z.infer<typeof analysisFormSchema>;

interface AnalysisFormProps extends CardProps {
  calculatorId: number;
  investments: Investment[];
  defaultValues?: Partial<AnalysisFormValues>;
  onSubmit: (data: AnalysisFormValues) => void;
  isLoading?: boolean;
}

const AnalysisForm: React.FC<AnalysisFormProps> = ({
  calculatorId,
  investments,
  defaultValues = {
    calculatorId: undefined,
    name: '',
    type: 'mortgage',
    investmentId: null,
    isDefault: false,
    status: 'active',
    parameters: {},
    results: {},
  },
  onSubmit,
  isLoading = false,
  ...props
}) => {
  // Set the calculator ID in the default values
  const formDefaultValues = {
    ...defaultValues,
    calculatorId,
  };

  const [selectedType, setSelectedType] = useState<string>(formDefaultValues.type || 'mortgage');

  const form = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisFormSchema),
    defaultValues: formDefaultValues,
  });

  // Update the form type when the tab changes
  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    form.setValue('type', value as any);
    
    // Reset parameters when type changes
    form.setValue('parameters', {});
  };

  // Get the selected investment based on the form value
  const selectedInvestmentId = form.watch('investmentId');
  const selectedInvestment = investments.find(inv => inv.id === selectedInvestmentId);

  // Watch the parameters to update the results preview
  const parameters = form.watch('parameters');

  // Prepare parameters form based on selected analysis type
  const renderParametersForm = () => {
    switch (selectedType) {
      case 'mortgage':
        return renderMortgageParametersForm();
      case 'cashflow':
        return renderCashflowParametersForm();
      case 'sensitivity':
        return renderSensitivityParametersForm();
      case 'comparison':
        return renderComparisonParametersForm();
      case 'yield':
        return renderYieldParametersForm();
      default:
        return null;
    }
  };

  // Mortgage parameters form
  const renderMortgageParametersForm = () => {
    return (
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="parameters.loanAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>סכום הלוואה (€)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                סכום ההלוואה ביורו
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parameters.interestRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ריבית שנתית (%)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.1" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                שיעור הריבית השנתית על ההלוואה
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parameters.loanTerm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>תקופת ההלוואה (שנים)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                תקופת ההלוואה בשנים
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parameters.loanType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>סוג הלוואה</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סוג הלוואה" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="israel">משכנתא בישראל</SelectItem>
                  <SelectItem value="cyprus">משכנתא בקפריסין</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                סוג ההלוואה משפיע על התנאים והמאפיינים
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preview mortgage results */}
        {parameters.loanAmount && parameters.interestRate && parameters.loanTerm && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">תצוגה מקדימה של התוצאות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>תשלום חודשי:</span>
                <span className="font-semibold">
                  {formatCurrency(calculateMortgagePayment(
                    parameters.loanAmount,
                    parameters.interestRate,
                    parameters.loanTerm
                  ), 'EUR')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>יחס הלוואה לשווי (LTV):</span>
                <span className="font-semibold">
                  {selectedInvestment ? formatPercentage(calculateLTV(
                    parameters.loanAmount,
                    selectedInvestment.priceOverride || 0
                  )) : 'לא זמין'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>סך תשלומי ריבית:</span>
                <span className="font-semibold">
                  {formatCurrency((calculateMortgagePayment(
                    parameters.loanAmount,
                    parameters.interestRate,
                    parameters.loanTerm
                  ) * parameters.loanTerm * 12) - parameters.loanAmount, 'EUR')}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Cashflow parameters form
  const renderCashflowParametersForm = () => {
    return (
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="parameters.period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>תקופת ניתוח (שנים)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                תקופת הניתוח בשנים
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parameters.initialInvestment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>השקעה התחלתית (€)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                סכום ההשקעה ההתחלתית ביורו
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parameters.monthlyRent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>שכירות חודשית (€)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                הכנסה חודשית משכירות ביורו
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parameters.mortgagePayment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>תשלום משכנתא חודשי (€)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                תשלום חודשי למשכנתא ביורו
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="parameters.managementFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>דמי ניהול חודשיים (€)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parameters.propertyTax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>מיסי נכס חודשיים (€)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parameters.insurance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ביטוח חודשי (€)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parameters.maintenance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>תחזוקה חודשית (€)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="parameters.annualAppreciation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>התייקרות שנתית של הנכס (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parameters.annualRentIncrease"
            render={({ field }) => (
              <FormItem>
                <FormLabel>עליית שכירות שנתית (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Preview cashflow results */}
        {parameters.initialInvestment && parameters.monthlyRent && (parameters.period || parameters.period === 0) && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">תצוגה מקדימה של התוצאות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>תזרים מזומנים חודשי:</span>
                <span className="font-semibold">
                  {formatCurrency(calculateCashFlow(
                    parameters.monthlyRent || 0,
                    parameters.mortgagePayment || 0,
                    parameters.managementFee || 0,
                    (parameters.propertyTax || 0) + 
                    (parameters.insurance || 0) + 
                    (parameters.maintenance || 0)
                  ), 'EUR')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>תשואה על ההשקעה (ROI):</span>
                <span className="font-semibold">
                  {formatPercentage(calculateROI(
                    calculateCashFlow(
                      parameters.monthlyRent || 0,
                      parameters.mortgagePayment || 0,
                      parameters.managementFee || 0,
                      (parameters.propertyTax || 0) + 
                      (parameters.insurance || 0) + 
                      (parameters.maintenance || 0)
                    ) * 12,
                    parameters.initialInvestment || 0
                  ))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>תקופת החזר השקעה (שנים):</span>
                <span className="font-semibold">
                  {calculatePaybackPeriod(
                    parameters.initialInvestment || 0,
                    calculateCashFlow(
                      parameters.monthlyRent || 0,
                      parameters.mortgagePayment || 0,
                      parameters.managementFee || 0,
                      (parameters.propertyTax || 0) + 
                      (parameters.insurance || 0) + 
                      (parameters.maintenance || 0)
                    ) * 12
                  ).toFixed(1)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Sensitivity parameters form
  const renderSensitivityParametersForm = () => {
    const sensitivityParameters = [
      { value: 'price', label: 'מחיר הנכס' },
      { value: 'rent', label: 'שכירות חודשית' },
      { value: 'interestRate', label: 'ריבית משכנתא' },
      { value: 'exchangeRate', label: 'שער חליפין' },
      { value: 'vacancyRate', label: 'שיעור תפוסה' },
    ];

    const affectedParameters = [
      { value: 'cashflow', label: 'תזרים מזומנים' },
      { value: 'roi', label: 'תשואה על ההשקעה' },
      { value: 'mortgagePayment', label: 'תשלום משכנתא' },
      { value: 'yield', label: 'תשואה שנתית' },
    ];

    return (
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="parameters.baseParameter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>פרמטר לניתוח</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר פרמטר לניתוח" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sensitivityParameters.map((param) => (
                    <SelectItem key={param.value} value={param.value}>
                      {param.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                הפרמטר שלגביו תיבדק הרגישות
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parameters.baseValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ערך בסיס</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                ערך הבסיס של הפרמטר הנבדק
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parameters.rangePercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>טווח בדיקה (%): {field.value || 20}%</FormLabel>
              <FormControl>
                <Slider
                  defaultValue={[field.value || 20]}
                  min={5}
                  max={50}
                  step={5}
                  onValueChange={(values) => field.onChange(values[0])}
                />
              </FormControl>
              <FormDescription>
                טווח השינוי באחוזים מערך הבסיס (±)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parameters.steps"
          render={({ field }) => (
            <FormItem>
              <FormLabel>מספר נקודות מדידה: {field.value || 5}</FormLabel>
              <FormControl>
                <Slider
                  defaultValue={[field.value || 5]}
                  min={3}
                  max={10}
                  step={1}
                  onValueChange={(values) => field.onChange(values[0])}
                />
              </FormControl>
              <FormDescription>
                מספר נקודות המדידה בטווח הנבדק
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parameters.affectedParameter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>פרמטר מושפע</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר פרמטר מושפע" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {affectedParameters.map((param) => (
                    <SelectItem key={param.value} value={param.value}>
                      {param.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                הפרמטר שייבדק כתוצאה מהשינוי
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  };

  // Comparison parameters form
  const renderComparisonParametersForm = () => {
    const comparisonParameters = [
      { value: 'price', label: 'מחיר' },
      { value: 'monthlyRent', label: 'שכירות חודשית' },
      { value: 'yield', label: 'תשואה' },
      { value: 'cashflow', label: 'תזרים מזומנים' },
      { value: 'roi', label: 'החזר השקעה' },
      { value: 'mortgagePayment', label: 'תשלום משכנתא' },
    ];

    return (
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="parameters.investmentIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>אפשרויות השקעה להשוואה</FormLabel>
              <FormDescription>
                בחר לפחות שתי אפשרויות השקעה להשוואה
              </FormDescription>
              <div className="space-y-2">
                {investments.map((investment) => (
                  <div key={investment.id} className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      id={`investment-${investment.id}`}
                      checked={(field.value || []).includes(investment.id)}
                      onChange={(e) => {
                        const currentValues = field.value || [];
                        if (e.target.checked) {
                          field.onChange([...currentValues, investment.id]);
                        } else {
                          field.onChange(currentValues.filter(id => id !== investment.id));
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label 
                      htmlFor={`investment-${investment.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {investment.name}
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parameters.parameters"
          render={({ field }) => (
            <FormItem>
              <FormLabel>פרמטרים להשוואה</FormLabel>
              <FormDescription>
                בחר את הפרמטרים שיושוו בין אפשרויות ההשקעה
              </FormDescription>
              <div className="space-y-2">
                {comparisonParameters.map((param) => (
                  <div key={param.value} className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      id={`param-${param.value}`}
                      checked={(field.value || []).includes(param.value)}
                      onChange={(e) => {
                        const currentValues = field.value || [];
                        if (e.target.checked) {
                          field.onChange([...currentValues, param.value]);
                        } else {
                          field.onChange(currentValues.filter(val => val !== param.value));
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label 
                      htmlFor={`param-${param.value}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {param.label}
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  };

  // Yield parameters form
  const renderYieldParametersForm = () => {
    return (
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="parameters.purchasePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>מחיר רכישה (€)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                מחיר הרכישה של הנכס ביורו
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parameters.monthlyRent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>שכירות חודשית (€)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                הכנסה חודשית משכירות ביורו
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="parameters.closingCosts"
            render={({ field }) => (
              <FormItem>
                <FormLabel>עלויות סגירה (€)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parameters.renovationCosts"
            render={({ field }) => (
              <FormItem>
                <FormLabel>עלויות שיפוץ (€)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="parameters.vacancyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>שיעור אי-תפוסה (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    max="100" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  אחוז הזמן שהנכס לא יהיה מושכר
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parameters.expenseRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>שיעור הוצאות (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    max="100" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  אחוז ההוצאות מההכנסה
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Preview yield results */}
        {parameters.purchasePrice && parameters.monthlyRent && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">תצוגה מקדימה של התוצאות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>תשואה ברוטו שנתית:</span>
                <span className="font-semibold">
                  {formatPercentage((parameters.monthlyRent * 12) / parameters.purchasePrice * 100)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>תשואה נטו שנתית:</span>
                <span className="font-semibold">
                  {formatPercentage(
                    (parameters.monthlyRent * 12 * (1 - (parameters.vacancyRate || 0) / 100) * (1 - (parameters.expenseRate || 0) / 100)) / 
                    (parameters.purchasePrice + (parameters.closingCosts || 0) + (parameters.renovationCosts || 0)) * 100
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const handleSubmit = (data: AnalysisFormValues) => {
    // Generate results based on parameters and analysis type
    const results = generateResults(data.type, data.parameters);
    
    // Add the results to the data
    const finalData = {
      ...data,
      results
    };
    
    onSubmit(finalData);
  };

  // Generate results based on analysis type and parameters
  const generateResults = (type: string, params: any) => {
    // This would be much more sophisticated in a real app
    // Just generating placeholder results for now
    switch (type) {
      case 'mortgage':
        if (params.loanAmount && params.interestRate && params.loanTerm) {
          const monthlyPayment = calculateMortgagePayment(
            params.loanAmount,
            params.interestRate,
            params.loanTerm
          );
          const totalPayments = monthlyPayment * params.loanTerm * 12;
          const totalInterest = totalPayments - params.loanAmount;
          
          return {
            monthlyPayment,
            totalPayments,
            totalInterest,
            loanType: params.loanType,
            amortizationSchedule: [] // Would be calculated in a real app
          };
        }
        break;
      
      case 'cashflow':
        if (params.initialInvestment && params.monthlyRent) {
          const monthlyCashflow = calculateCashFlow(
            params.monthlyRent,
            params.mortgagePayment || 0,
            params.managementFee || 0,
            (params.propertyTax || 0) + (params.insurance || 0) + (params.maintenance || 0)
          );
          const annualCashflow = monthlyCashflow * 12;
          const roi = calculateROI(annualCashflow, params.initialInvestment);
          const paybackPeriod = calculatePaybackPeriod(params.initialInvestment, annualCashflow);
          
          return {
            monthlyCashflow,
            annualCashflow,
            roi,
            paybackPeriod,
            cashflowProjection: [] // Would be calculated in a real app
          };
        }
        break;
      
      case 'sensitivity':
        return {
          sensitivityData: [],
          baseParameter: params.baseParameter,
          affectedParameter: params.affectedParameter,
          baseValue: params.baseValue,
          rangePercentage: params.rangePercentage,
          steps: params.steps
        };
      
      case 'comparison':
        return {
          comparisonData: {
            investments: params.investmentIds,
            parameters: params.parameters,
            data: []
          }
        };
      
      case 'yield':
        if (params.purchasePrice && params.monthlyRent) {
          const grossYield = (params.monthlyRent * 12) / params.purchasePrice * 100;
          const totalInvestment = params.purchasePrice + (params.closingCosts || 0) + (params.renovationCosts || 0);
          const effectiveRent = params.monthlyRent * 12 * (1 - (params.vacancyRate || 0) / 100);
          const expenses = effectiveRent * ((params.expenseRate || 0) / 100);
          const netIncome = effectiveRent - expenses;
          const netYield = (netIncome / totalInvestment) * 100;
          
          return {
            grossYield,
            netYield,
            totalInvestment,
            annualRent: params.monthlyRent * 12,
            effectiveRent,
            expenses,
            netIncome
          };
        }
        break;
      
      default:
        return {};
    }
    
    return {};
  };

  return (
    <Card className="w-full" {...props}>
      <CardHeader>
        <CardTitle>ניתוח חדש</CardTitle>
        <CardDescription>
          יצירת ניתוח חדש לבחינת השקעה
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם הניתוח</FormLabel>
                  <FormControl>
                    <Input placeholder="לדוגמה: ניתוח משכנתא לדירה בפאפוס" {...field} />
                  </FormControl>
                  <FormDescription>
                    שם ייחודי לזיהוי הניתוח
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="investmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>אפשרות השקעה</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר אפשרות השקעה (אופציונלי)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">כל האפשרויות</SelectItem>
                      {investments.map((investment) => (
                        <SelectItem key={investment.id} value={investment.id.toString()}>
                          {investment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    ניתן לבחור אפשרות השקעה ספציפית או להשאיר ריק לניתוח כללי
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">ניתוח ברירת מחדל</FormLabel>
                    <FormDescription>
                      האם זהו ניתוח ברירת המחדל מסוג זה?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div>
              <FormLabel>סוג ניתוח</FormLabel>
              <FormDescription className="mb-2">
                בחר את סוג הניתוח שברצונך לבצע
              </FormDescription>
              <Tabs 
                defaultValue={selectedType} 
                onValueChange={handleTypeChange}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
                  {analysisTypes.map((type) => (
                    <TabsTrigger key={type.value} value={type.value}>
                      {type.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div className="mt-6">
                  {renderParametersForm()}
                </div>
              </Tabs>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline">בטל</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'מעבד...' : 'שמור ניתוח'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default AnalysisForm;

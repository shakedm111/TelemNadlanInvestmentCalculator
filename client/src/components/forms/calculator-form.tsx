import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-locale";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Calculator } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

// Form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "שם המחשבון חייב להכיל לפחות 2 תווים",
  }),
  investorId: z.string().min(1, {
    message: "יש לבחור משקיע",
  }).transform(val => parseInt(val, 10)),
  selfEquity: z.string().transform(val => parseFloat(val) || 0),
  hasMortgage: z.boolean(),
  hasPropertyInIsrael: z.boolean(),
  investmentPreference: z.string(),
  exchangeRate: z.string().transform(val => parseFloat(val) || 3.95),
  vatRate: z.string().transform(val => parseFloat(val) || 19),
  status: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface CalculatorFormProps {
  calculator?: Calculator;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
}

export default function CalculatorForm({
  calculator,
  onSubmit,
  onCancel,
}: CalculatorFormProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch investors
  const { data: investors } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["/api/investors"],
  });

  // Form default values
  const defaultValues: Partial<FormValues> = {
    name: calculator?.name || "",
    investorId: calculator?.userId ? calculator.userId.toString() : "",
    selfEquity: calculator?.selfEquity ? calculator.selfEquity.toString() : "0",
    hasMortgage: calculator?.hasMortgage || false,
    hasPropertyInIsrael: calculator?.hasPropertyInIsrael || false,
    investmentPreference: calculator?.investmentPreference || "positive_cashflow",
    exchangeRate: calculator?.exchangeRate ? calculator.exchangeRate.toString() : "3.95",
    vatRate: calculator?.vatRate ? calculator.vatRate.toString() : "19",
    status: calculator?.status || "draft",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      await onSubmit(values);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (calculator) {
      form.reset({
        name: calculator.name,
        investorId: calculator.userId.toString(),
        selfEquity: calculator.selfEquity.toString(),
        hasMortgage: calculator.hasMortgage,
        hasPropertyInIsrael: calculator.hasPropertyInIsrael,
        investmentPreference: calculator.investmentPreference,
        exchangeRate: calculator.exchangeRate.toString(),
        vatRate: calculator.vatRate.toString(),
        status: calculator.status,
      });
    }
  }, [calculator, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calculator Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t("calculators.details")}</h3>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("calculators.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="investorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("calculators.investor")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר משקיע" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {investors?.map((investor) => (
                        <SelectItem key={investor.id} value={investor.id.toString()}>
                          {investor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="selfEquity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("calculators.self_equity")} (₪)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex space-x-4 space-x-reverse">
              <FormField
                control={form.control}
                name="hasMortgage"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-x-reverse">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="mr-2">
                      {t("calculators.has_mortgage")}
                    </FormLabel>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hasPropertyInIsrael"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-x-reverse">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="mr-2">
                      {t("calculators.has_property_in_israel")}
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="investmentPreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("calculators.investment_preference")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר העדפה" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="positive_cashflow">
                        {t("preference.positive_cashflow")}
                      </SelectItem>
                      <SelectItem value="low_interest">
                        {t("preference.low_interest")}
                      </SelectItem>
                      <SelectItem value="high_yield">
                        {t("preference.high_yield")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          
          {/* System Parameters */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t("calculators.system_params")}</h3>
            
            <FormField
              control={form.control}
              name="exchangeRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("calculators.exchange_rate")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="vatRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("calculators.vat_rate")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("calculators.status")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר סטטוס" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">{t("status.active")}</SelectItem>
                      <SelectItem value="draft">{t("status.draft")}</SelectItem>
                      <SelectItem value="archived">{t("status.archived")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 space-x-reverse">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "שומר..." : t("button.save")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t("button.cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

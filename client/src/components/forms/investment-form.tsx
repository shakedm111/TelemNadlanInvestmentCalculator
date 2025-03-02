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
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/hooks/use-locale";
import { useState, useEffect } from "react";
import { Investment, Property } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

// Form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "שם ההשקעה חייב להכיל לפחות 2 תווים",
  }),
  propertyId: z.number().min(1, {
    message: "יש לבחור נכס",
  }),
  priceOverride: z.number().nullable().optional(),
  monthlyRentOverride: z.number().nullable().optional(),
  hasFurniture: z.boolean().default(false),
  hasPropertyManagement: z.boolean().default(false),
  hasRealEstateAgent: z.boolean().default(false),
  isSelected: z.boolean().default(false),
});

export type InvestmentFormValues = z.infer<typeof formSchema>;

interface InvestmentFormProps {
  calculatorId: number;
  investment?: Investment;
  properties: Property[];
  onSubmit: (values: InvestmentFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function InvestmentForm({
  calculatorId,
  investment,
  properties,
  onSubmit,
  onCancel,
  isLoading = false,
}: InvestmentFormProps) {
  const { t } = useTranslation();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Find property for initial selection and display
  useEffect(() => {
    if (investment && investment.propertyId) {
      const property = properties.find(p => p.id === investment.propertyId);
      if (property) {
        setSelectedProperty(property);
      }
    }
  }, [investment, properties]);

  // Form default values
  const defaultValues: Partial<InvestmentFormValues> = {
    name: investment ? investment.name : "",
    propertyId: investment ? investment.propertyId : 0,
    priceOverride: investment && investment.priceOverride !== null ? Number(investment.priceOverride) : null,
    monthlyRentOverride: investment && investment.monthlyRentOverride !== null ? Number(investment.monthlyRentOverride) : null,
    hasFurniture: investment ? investment.hasFurniture : false,
    hasPropertyManagement: investment ? investment.hasPropertyManagement : false,
    hasRealEstateAgent: investment ? investment.hasRealEstateAgent : false,
    isSelected: investment ? investment.isSelected : false,
  };

  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handlePropertyChange = (id: number) => {
    const property = properties.find(p => p.id === id);
    if (property) {
      setSelectedProperty(property);
      
      // Clear overrides when property changes
      form.setValue("priceOverride", null);
      form.setValue("monthlyRentOverride", null);
    }
  };

  const handleSubmit = (values: InvestmentFormValues) => {
    // Add calculatorId to values
    onSubmit({
      ...values,
      // Ensure proper typing for optional numeric fields
      priceOverride: values.priceOverride === 0 ? null : values.priceOverride,
      monthlyRentOverride: values.monthlyRentOverride === 0 ? null : values.monthlyRentOverride,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("investments.name")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="שם ההשקעה" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="propertyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("investments.property")}</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(parseInt(value));
                    handlePropertyChange(parseInt(value));
                  }}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר נכס" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id.toString()}>
                        {property.name} - {formatCurrency(Number(property.priceWithoutVAT), "EUR")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {selectedProperty && (
            <div className="bg-muted p-4 rounded-md mb-4">
              <h3 className="text-sm font-medium mb-2">נתוני הנכס הנבחר</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>מחיר: <span className="font-medium">{formatCurrency(Number(selectedProperty.priceWithoutVAT), "EUR")}</span></div>
                <div>שכ"ד חודשי: <span className="font-medium">{formatCurrency(Number(selectedProperty.monthlyRent), "EUR")}</span></div>
                <div>מיקום: <span className="font-medium">{selectedProperty.location}</span></div>
                <div>חדרי שינה: <span className="font-medium">{selectedProperty.bedrooms}</span></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="priceOverride"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("investments.price_override")} (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={selectedProperty ? selectedProperty.priceWithoutVAT.toString() : "מחיר מותאם"}
                      {...field}
                      value={field.value === null ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value === "" ? null : Number(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    השאר ריק לשימוש במחיר המקורי של הנכס
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="monthlyRentOverride"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("investments.rent_override")} (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={selectedProperty ? selectedProperty.monthlyRent.toString() : "שכ״ד מותאם"}
                      {...field}
                      value={field.value === null ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value === "" ? null : Number(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    השאר ריק לשימוש בשכ״ד המקורי של הנכס
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4 bg-background p-4 rounded-md border">
            <h3 className="text-sm font-medium">אפשרויות נוספות</h3>
            
            <FormField
              control={form.control}
              name="hasFurniture"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-x-reverse">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="mr-2">
                    {t("investments.has_furniture")}
                  </FormLabel>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="hasPropertyManagement"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-x-reverse">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="mr-2">
                    {t("investments.has_property_management")}
                  </FormLabel>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="hasRealEstateAgent"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-x-reverse">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="mr-2">
                    {t("investments.has_real_estate_agent")}
                  </FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isSelected"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-x-reverse">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="mr-2 font-medium">
                    {t("investments.is_selected")}
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 space-x-reverse">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "שומר..." : investment ? t("button.update") : t("button.create")}
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
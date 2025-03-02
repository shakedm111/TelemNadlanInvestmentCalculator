import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertInvestmentSchema } from '@shared/schema';
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
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Property } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';

// Extend the insertInvestmentSchema with additional validations
const investmentFormSchema = insertInvestmentSchema.extend({
  propertyId: z.coerce.number().min(1, {
    message: 'יש לבחור נכס',
  }),
  priceOverride: z.coerce
    .number()
    .nullable()
    .transform((val) => (val === 0 ? null : val)),
  monthlyRentOverride: z.coerce
    .number()
    .nullable()
    .transform((val) => (val === 0 ? null : val)),
});

type InvestmentFormValues = z.infer<typeof investmentFormSchema>;

interface InvestmentFormProps {
  calculatorId: number;
  properties: Property[];
  defaultValues?: Partial<InvestmentFormValues>;
  onSubmit: (data: InvestmentFormValues) => void;
  isLoading?: boolean;
}

const InvestmentForm: React.FC<InvestmentFormProps> = ({
  calculatorId,
  properties,
  defaultValues = {
    calculatorId: undefined,
    propertyId: undefined,
    name: '',
    isSelected: false,
    hasFurniture: false,
    hasPropertyManagement: false,
    hasRealEstateAgent: false,
    priceOverride: null,
    monthlyRentOverride: null,
  },
  onSubmit,
  isLoading = false,
}) => {
  // Set the calculator ID in the default values
  const formDefaultValues = {
    ...defaultValues,
    calculatorId,
  };

  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentFormSchema),
    defaultValues: formDefaultValues,
  });

  const handleSubmit = (data: InvestmentFormValues) => {
    onSubmit(data);
  };

  // Get the selected property based on the form value
  const selectedPropertyId = form.watch('propertyId');
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // Update investment name when property changes
  React.useEffect(() => {
    if (selectedProperty && !form.getValues('name')) {
      form.setValue('name', selectedProperty.name);
    }
  }, [selectedProperty, form]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>אפשרות השקעה חדשה</CardTitle>
        <CardDescription>
          הוספת אפשרות השקעה חדשה למחשבון
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>בחר נכס</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר נכס מהרשימה" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.name} - {property.location} - {formatCurrency(property.priceWithoutVAT, 'EUR')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    בחר נכס קיים מספריית הנכסים
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם אפשרות ההשקעה</FormLabel>
                  <FormControl>
                    <Input placeholder="לדוגמה: דירה בפאפוס" {...field} />
                  </FormControl>
                  <FormDescription>
                    שם ייחודי לזיהוי אפשרות ההשקעה
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="priceOverride"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מחיר מותאם (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={selectedProperty ? selectedProperty.priceWithoutVAT.toString() : '0'} 
                        {...field}
                        value={field.value === null ? '' : field.value} 
                        onChange={(e) => {
                          const value = e.target.value === '' ? null : parseFloat(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {selectedProperty && (
                        <>מחיר מקורי: {formatCurrency(selectedProperty.priceWithoutVAT, 'EUR')}</>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monthlyRentOverride"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שכירות חודשית מותאמת (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={selectedProperty ? selectedProperty.monthlyRent.toString() : '0'} 
                        {...field}
                        value={field.value === null ? '' : field.value} 
                        onChange={(e) => {
                          const value = e.target.value === '' ? null : parseFloat(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {selectedProperty && (
                        <>שכירות מקורית: {formatCurrency(selectedProperty.monthlyRent, 'EUR')}</>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="isSelected"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">אפשרות נבחרת</FormLabel>
                      <FormDescription>
                        האם זו אפשרות ההשקעה המועדפת?
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

              <FormField
                control={form.control}
                name="hasFurniture"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">ריהוט</FormLabel>
                      <FormDescription>
                        האם כולל ריהוט?
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

              <FormField
                control={form.control}
                name="hasPropertyManagement"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">ניהול נכס</FormLabel>
                      <FormDescription>
                        האם כולל דמי ניהול? (10% מהשכירות השנתית)
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

              <FormField
                control={form.control}
                name="hasRealEstateAgent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">דמי תיווך</FormLabel>
                      <FormDescription>
                        האם כולל דמי תיווך? (חודש שכירות)
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
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline">בטל</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'מעבד...' : 'הוסף אפשרות השקעה'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default InvestmentForm;

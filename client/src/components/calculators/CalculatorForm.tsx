import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertCalculatorSchema } from '@shared/schema';
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

// Extend the insertCalculatorSchema with additional validations
const calculatorFormSchema = insertCalculatorSchema.extend({
  selfEquity: z.coerce.number().min(1, {
    message: 'יש להזין הון עצמי גדול מ-0',
  }),
  exchangeRate: z.coerce.number().min(0.01, {
    message: 'יש להזין שער חליפין תקין',
  }),
  vatRate: z.coerce.number().min(0, {
    message: 'שיעור המע"מ לא יכול להיות שלילי',
  }).max(1, {
    message: 'שיעור המע"מ חייב להיות בין 0 ל-1',
  }),
});

type CalculatorFormValues = z.infer<typeof calculatorFormSchema>;

interface CalculatorFormProps {
  defaultValues?: Partial<CalculatorFormValues>;
  onSubmit: (data: CalculatorFormValues) => void;
  isLoading?: boolean;
}

const CalculatorForm: React.FC<CalculatorFormProps> = ({
  defaultValues = {
    name: '',
    selfEquity: 1000000,
    hasMortgage: false,
    hasPropertyInIsrael: false,
    exchangeRate: 3.98,
    vatRate: 0.19,
    status: 'draft',
  },
  onSubmit,
  isLoading = false,
}) => {
  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorFormSchema),
    defaultValues,
  });

  const handleSubmit = (data: CalculatorFormValues) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>מחשבון חדש</CardTitle>
        <CardDescription>
          יצירת מחשבון חדש לניתוח השקעות נדל"ן
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
                  <FormLabel>שם המחשבון</FormLabel>
                  <FormControl>
                    <Input placeholder="לדוגמה: השקעה בפאפוס" {...field} />
                  </FormControl>
                  <FormDescription>
                    שם ייחודי לזיהוי המחשבון
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="selfEquity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הון עצמי (₪)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    סכום ההון העצמי הזמין להשקעה בש"ח
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="hasMortgage"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">משכנתא</FormLabel>
                      <FormDescription>
                        האם נדרש מימון משכנתא?
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
                name="hasPropertyInIsrael"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">נכס בישראל</FormLabel>
                      <FormDescription>
                        האם קיים נכס בישראל?
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="exchangeRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שער חליפין (₪/€)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      שער החליפין בין ש"ח ליורו
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vatRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מע"מ (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={field.value} 
                        onChange={e => {
                          // Convert percentage input to decimal
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value)) {
                            const decimalValue = value <= 1 ? value : value / 100;
                            field.onChange(decimalValue);
                          } else {
                            field.onChange(e);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      שיעור המע"מ בקפריסין (לדוגמה: 0.19 או 19%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">בטל</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'מעבד...' : 'שמור מחשבון'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default CalculatorForm;

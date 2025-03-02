import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/use-locale";
import { Property } from "@shared/schema";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dispatch, SetStateAction, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

// Form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "שם הנכס חייב להכיל לפחות 2 תווים",
  }),
  priceWithoutVAT: z.number().min(1, {
    message: "מחיר הנכס חייב להיות גדול מ-0",
  }),
  monthlyRent: z.number().min(1, {
    message: "שכר הדירה החודשי חייב להיות גדול מ-0",
  }),
  guaranteedRent: z.boolean().default(false),
  deliveryDate: z.date({
    required_error: "תאריך מסירה הוא שדה חובה",
  }),
  bedrooms: z.number().min(0, {
    message: "מספר חדרי השינה לא יכול להיות שלילי",
  }),
  location: z.string().min(2, {
    message: "מיקום הנכס חייב להכיל לפחות 2 תווים",
  }),
});

export type PropertyFormValues = z.infer<typeof formSchema>;

interface PropertyDialogProps {
  property?: Property;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export function PropertyDialog({ property, setOpen }: PropertyDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form default values
  const defaultValues: Partial<PropertyFormValues> = {
    name: property?.name || "",
    priceWithoutVAT: property ? Number(property.priceWithoutVAT) : 0,
    monthlyRent: property ? Number(property.monthlyRent) : 0,
    guaranteedRent: property?.guaranteedRent || false,
    deliveryDate: property?.deliveryDate ? new Date(property.deliveryDate) : new Date(),
    bedrooms: property?.bedrooms || 1,
    location: property?.location || "",
  };

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleSubmit = async (values: PropertyFormValues) => {
    setIsLoading(true);
    try {
      if (property?.id) {
        // Update
        await apiRequest("PATCH", `/api/properties/${property.id}`, values);
        toast({
          title: "נכס עודכן",
          description: "הנכס עודכן בהצלחה",
        });
      } else {
        // Create
        await apiRequest("POST", "/api/properties", values);
        toast({
          title: "נכס נוצר",
          description: "הנכס נוצר בהצלחה",
        });
      }
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setOpen(false);
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת שמירת הנכס",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const title = property?.id 
    ? `עריכת נכס: ${property.name}` 
    : "הוספת נכס חדש";

  return (
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {property?.id 
            ? "עדכון פרטי הנכס"
            : "הכנסת פרטי נכס חדש למערכת"}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("properties.name")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="שם הנכס" />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="priceWithoutVAT"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("properties.price")} (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="מחיר הנכס"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      value={field.value}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="monthlyRent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("properties.rent")} (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="שכר דירה חודשי"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      value={field.value}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("properties.bedrooms")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="מספר חדרי שינה"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      value={field.value}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("properties.location")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="עיר/אזור" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="deliveryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t("properties.delivery_date")}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-right"
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: he })
                          ) : (
                            <span>בחר תאריך</span>
                          )}
                          <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guaranteedRent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0 mt-8">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none mr-2">
                    <FormLabel>
                      {t("properties.guaranteed_rent")}
                    </FormLabel>
                    <FormDescription>
                      שכר דירה מובטח ע"י היזם
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end space-x-4 space-x-reverse pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "שומר..." : property?.id ? t("button.update") : t("button.create")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              {t("button.cancel")}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}
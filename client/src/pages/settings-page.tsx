import MainLayout from "@/components/layouts/main-layout";
import PageHeader from "@/components/ui/page-header";
import { useTranslation } from "@/hooks/use-locale";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

// Form schema for general settings
const generalSettingsSchema = z.object({
  exchangeRate: z.string().min(1, {
    message: "שער חליפין חייב להיות גדול מ-0",
  }),
  vatRate: z.string().min(1, {
    message: "שיעור מע\"מ חייב להיות גדול מ-0",
  }),
  mortgageRateIsrael: z.string().min(1, {
    message: "ריבית משכנתא בישראל חייבת להיות גדולה מ-0",
  }),
  mortgageRateCyprus: z.string().min(1, {
    message: "ריבית משכנתא בקפריסין חייבת להיות גדולה מ-0",
  }),
});

// Form schema for account settings
const accountSettingsSchema = z.object({
  name: z.string().min(2, {
    message: "שם חייב להכיל לפחות 2 תווים",
  }),
  email: z.string().email({
    message: "יש להזין כתובת אימייל תקינה",
  }),
  phone: z.string().min(9, {
    message: "מספר טלפון חייב להכיל לפחות 9 ספרות",
  }),
});

// Form schema for password change
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(6, {
    message: "סיסמה חייבת להכיל לפחות 6 תווים",
  }),
  newPassword: z.string().min(6, {
    message: "סיסמה חייבת להכיל לפחות 6 תווים",
  }),
  confirmPassword: z.string().min(6, {
    message: "סיסמה חייבת להכיל לפחות 6 תווים",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "הסיסמאות אינן תואמות",
  path: ["confirmPassword"],
});

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdvisor = user?.role === "advisor";

  // Fetch settings
  const { data: settings, isLoading: isSettingsLoading } = useQuery<{
    exchangeRate: string;
    vatRate: string;
    mortgageRateIsrael: string;
    mortgageRateCyprus: string;
  }>({
    queryKey: ["/api/settings"],
    enabled: isAdvisor,
  });

  // General settings form
  const generalSettingsForm = useForm<z.infer<typeof generalSettingsSchema>>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      exchangeRate: settings?.exchangeRate || "3.95",
      vatRate: settings?.vatRate || "19",
      mortgageRateIsrael: settings?.mortgageRateIsrael || "4.5",
      mortgageRateCyprus: settings?.mortgageRateCyprus || "3.8",
    },
  });

  // Account settings form
  const accountSettingsForm = useForm<z.infer<typeof accountSettingsSchema>>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  // Password change form
  const passwordChangeForm = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update settings mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await apiRequest("PUT", `/api/settings/${key}`, { value });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בשמירת הגדרות",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update account mutation
  const updateAccountMutation = useMutation({
    mutationFn: async (data: z.infer<typeof accountSettingsSchema>) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "חשבון עודכן",
        description: "פרטי החשבון עודכנו בהצלחה",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בעדכון חשבון",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordChangeSchema>) => {
      const res = await apiRequest("POST", `/api/users/${user?.id}/change-password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "סיסמה שונתה",
        description: "הסיסמה שונתה בהצלחה",
      });
      passwordChangeForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בשינוי סיסמה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle general settings form submit
  const onGeneralSettingsSubmit = (values: z.infer<typeof generalSettingsSchema>) => {
    // Update each setting
    updateSettingMutation.mutate({ key: "exchangeRate", value: values.exchangeRate });
    updateSettingMutation.mutate({ key: "vatRate", value: values.vatRate });
    updateSettingMutation.mutate({ key: "mortgageRateIsrael", value: values.mortgageRateIsrael });
    updateSettingMutation.mutate({ key: "mortgageRateCyprus", value: values.mortgageRateCyprus });

    toast({
      title: "הגדרות נשמרו",
      description: "ההגדרות הכלליות נשמרו בהצלחה",
    });
  };

  // Handle account settings form submit
  const onAccountSettingsSubmit = (values: z.infer<typeof accountSettingsSchema>) => {
    updateAccountMutation.mutate(values);
  };

  // Handle password change form submit
  const onPasswordChangeSubmit = (values: z.infer<typeof passwordChangeSchema>) => {
    changePasswordMutation.mutate(values);
  };

  return (
    <MainLayout>
      <PageHeader title={t("nav.settings")} />

      <div className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="general">הגדרות כלליות</TabsTrigger>
            <TabsTrigger value="account">הגדרות חשבון</TabsTrigger>
            <TabsTrigger value="notifications">התראות</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>הגדרות כלליות</CardTitle>
                <CardDescription>
                  הגדרות מערכתיות המשפיעות על כל המחשבונים
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAdvisor ? (
                  <Form {...generalSettingsForm}>
                    <form
                      onSubmit={generalSettingsForm.handleSubmit(onGeneralSettingsSubmit)}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={generalSettingsForm.control}
                          name="exchangeRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("calculators.exchange_rate")}</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" min="0" />
                              </FormControl>
                              <FormDescription>
                                שער החליפין הנוכחי בין שקל ליורו
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generalSettingsForm.control}
                          name="vatRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("calculators.vat_rate")}</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.1" min="0" />
                              </FormControl>
                              <FormDescription>
                                שיעור המע"מ הנוכחי בקפריסין
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generalSettingsForm.control}
                          name="mortgageRateIsrael"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("calculators.mortgage_rate_israel")}</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" min="0" />
                              </FormControl>
                              <FormDescription>
                                ריבית משכנתא ממוצעת בישראל
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generalSettingsForm.control}
                          name="mortgageRateCyprus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("calculators.mortgage_rate_cyprus")}</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" min="0" />
                              </FormControl>
                              <FormDescription>
                                ריבית משכנתא ממוצעת בקפריסין
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={updateSettingMutation.isPending}
                      >
                        {updateSettingMutation.isPending ? "שומר..." : t("button.save")}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    רק יועצי השקעות יכולים לשנות הגדרות כלליות
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>פרטי חשבון</CardTitle>
                  <CardDescription>
                    עדכון פרטי החשבון האישי שלך
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...accountSettingsForm}>
                    <form
                      onSubmit={accountSettingsForm.handleSubmit(onAccountSettingsSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={accountSettingsForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("auth.name")}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={accountSettingsForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("auth.email")}</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={accountSettingsForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("auth.phone")}</FormLabel>
                            <FormControl>
                              <Input {...field} type="tel" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={updateAccountMutation.isPending}
                      >
                        {updateAccountMutation.isPending ? "שומר..." : t("button.save")}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>שינוי סיסמה</CardTitle>
                  <CardDescription>
                    עדכון הסיסמה לחשבון שלך
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordChangeForm}>
                    <form
                      onSubmit={passwordChangeForm.handleSubmit(onPasswordChangeSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={passwordChangeForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>סיסמה נוכחית</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordChangeForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>סיסמה חדשה</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordChangeForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>אימות סיסמה חדשה</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                      >
                        {changePasswordMutation.isPending ? "שומר..." : "שנה סיסמה"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>הגדרות התראות</CardTitle>
                <CardDescription>
                  בחר אילו התראות ברצונך לקבל ובאיזה אופן
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">התראות מערכת</h4>
                      <p className="text-sm text-muted-foreground">
                        הודעות חשובות על המערכת והחשבון שלך
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">התראות על עדכונים ממשקיעים</h4>
                      <p className="text-sm text-muted-foreground">
                        קבל התראות כאשר משקיע משנה מחשבון
                      </p>
                    </div>
                    <Switch defaultChecked={isAdvisor} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">התראות על כנסים ואירועים</h4>
                      <p className="text-sm text-muted-foreground">
                        מידע על כנסים ואירועים בתחום ההשקעות
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">התראות דוא"ל</h4>
                      <p className="text-sm text-muted-foreground">
                        קבל התראות באמצעות הודעות דוא"ל
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">התראות SMS</h4>
                      <p className="text-sm text-muted-foreground">
                        קבל התראות באמצעות הודעות SMS (ייתכנו חיובים)
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Button>
                  {t("button.save")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

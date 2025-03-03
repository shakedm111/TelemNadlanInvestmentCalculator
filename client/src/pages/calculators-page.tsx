import MainLayout from "@/components/layouts/main-layout";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-locale";
import { useState } from "react";
import { Calculator } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import CalculatorCard from "@/components/ui/calculator-card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { CalculatorDialog } from "@/components/dialogs/calculator-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RefreshCw, Search } from "lucide-react";

export default function CalculatorsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [investorFilter, setInvestorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch calculators
  const { data: calculators, isLoading, refetch } = useQuery<Calculator[]>({
    queryKey: ["/api/calculators"],
  });

  // Fetch investors for filter
  const { data: investors } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["/api/investors"],
  });

  // Filter calculators
  const filteredCalculators = calculators?.filter((calculator) => {
    const nameMatch = calculator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     calculator.investorName.toLowerCase().includes(searchTerm.toLowerCase());
    const investorMatch = investorFilter && investorFilter !== "all" ? 
                          calculator.userId.toString() === investorFilter : true;
    const statusMatch = statusFilter && statusFilter !== "all" ? 
                        calculator.status === statusFilter : true;
    
    return nameMatch && investorMatch && statusMatch;
  });

  const handleDuplicate = async (id: number) => {
    try {
      await apiRequest("POST", `/api/calculators/${id}/duplicate`);
      queryClient.invalidateQueries({ queryKey: ["/api/calculators"] });
      toast({
        title: "מחשבון שוכפל",
        description: "עותק של המחשבון נוצר בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת שכפול המחשבון",
        variant: "destructive",
      });
    }
  };

  const handleShare = (id: number) => {
    toast({
      title: "שיתוף מחשבון",
      description: "אפשרות זו תהיה זמינה בקרוב",
    });
  };

  const handlePrint = (id: number) => {
    toast({
      title: "הדפסת מחשבון",
      description: "אפשרות זו תהיה זמינה בקרוב",
    });
  };

  return (
    <MainLayout>
      <PageHeader 
        title={t("calculators.title")} 
        buttonText={t("calculators.new")}
        onButtonClick={() => setDialogOpen(true)}
      />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t("button.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-3 pr-10"
            />
          </div>

          <Select value={investorFilter} onValueChange={setInvestorFilter}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder={t("calculators.investor")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המשקיעים</SelectItem>
              {investors?.map((investor) => (
                <SelectItem key={investor.id} value={investor.id.toString()}>
                  {investor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="min-w-[150px]">
              <SelectValue placeholder={t("calculators.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              <SelectItem value="active">{t("status.active")}</SelectItem>
              <SelectItem value="draft">{t("status.draft")}</SelectItem>
              <SelectItem value="archived">{t("status.archived")}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground mr-auto"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Calculator Grid */}
      {isLoading ? (
        <div className="text-center py-10">טוען מחשבונים...</div>
      ) : filteredCalculators?.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">לא נמצאו מחשבונים התואמים את החיפוש</p>
          <Button onClick={() => {
            setSearchTerm("");
            setInvestorFilter("all");
            setStatusFilter("all");
          }}>
            נקה פילטרים
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCalculators?.map((calculator) => (
            <CalculatorCard
              key={calculator.id}
              calculator={calculator}
              onDuplicate={handleDuplicate}
              onShare={handleShare}
              onPrint={handlePrint}
            />
          ))}
        </div>
      )}

      {/* New Calculator Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger className="hidden" />
        <CalculatorDialog setOpen={setDialogOpen} />
      </Dialog>
    </MainLayout>
  );
}

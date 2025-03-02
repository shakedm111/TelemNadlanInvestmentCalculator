import MainLayout from "@/components/layouts/main-layout";
import PageHeader from "@/components/ui/page-header";
import { useTranslation } from "@/hooks/use-locale";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, MoreHorizontal, Trash, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Analysis } from "@shared/schema";

export default function AnalysesPage() {
  const { t } = useTranslation();

  // Fetch analyses
  const { data: analyses, isLoading } = useQuery<Analysis[]>({
    queryKey: ["/api/analyses"],
  });

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case "mortgage":
        return t("analysis.mortgage");
      case "cashflow":
        return t("analysis.cashflow");
      case "sensitivity":
        return t("analysis.sensitivity");
      case "comparison":
        return t("analysis.comparison");
      case "yield":
        return t("analysis.yield");
      default:
        return type;
    }
  };

  const columns: ColumnDef<Analysis>[] = [
    {
      accessorKey: "name",
      header: t("analyses.name"),
    },
    {
      accessorKey: "type",
      header: t("analyses.type"),
      cell: ({ row }) => {
        return getAnalysisTypeLabel(row.original.type);
      },
    },
    {
      accessorKey: "calculatorName",
      header: t("analyses.calculator"),
    },
    {
      accessorKey: "investmentName",
      header: t("analyses.investment"),
      cell: ({ row }) => {
        return row.original.investmentName || "-";
      },
    },
    {
      accessorKey: "isDefault",
      header: "ברירת מחדל",
      cell: ({ row }) => {
        return row.original.isDefault ? (
          <Badge variant="success">כן</Badge>
        ) : (
          <Badge variant="secondary">לא</Badge>
        );
      },
    },
    {
      accessorKey: "updatedAt",
      header: "עודכן",
      cell: ({ row }) => {
        return formatDate(row.original.updatedAt);
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const analysis = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">פתח תפריט</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>פעולות</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Eye className="h-4 w-4 ml-2" />
                צפה בניתוח
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 ml-2" />
                ערוך ניתוח
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Trash className="h-4 w-4 ml-2" />
                מחק ניתוח
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title={t("analyses.title")}
        buttonText={t("analyses.new")}
        onButtonClick={() => {}}
      />

      {isLoading ? (
        <div className="text-center py-10">טוען ניתוחים...</div>
      ) : (
        <DataTable
          columns={columns}
          data={analyses || []}
          searchField="name"
          placeholder="חיפוש לפי שם..."
        />
      )}
    </MainLayout>
  );
}

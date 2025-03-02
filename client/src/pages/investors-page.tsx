import { useState } from "react";
import MainLayout from "@/components/layouts/main-layout";
import PageHeader from "@/components/ui/page-header";
import { useTranslation } from "@/hooks/use-locale";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, MoreHorizontal, Plus, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@shared/schema";
import { CreateInvestorDialog } from "@/components/investors/create-investor-dialog";

export default function InvestorsPage() {
  const { t } = useTranslation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch investors - only accessible by advisors (role='advisor')
  const { data: investors, isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/investors"],
  });

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: t("investors.name") || "שם",
    },
    {
      accessorKey: "username",
      header: t("investors.username") || "שם משתמש",
    },
    {
      accessorKey: "email",
      header: t("investors.email") || "אימייל",
      cell: ({ row }) => {
        return row.original.email || "---";
      },
    },
    {
      accessorKey: "phone",
      header: t("investors.phone") || "טלפון",
      cell: ({ row }) => {
        return row.original.phone || "---";
      },
    },
    {
      accessorKey: "calculatorsCount",
      header: t("investors.calculators_count") || "מס' מחשבונים",
      cell: ({ row }) => {
        return (
          <Badge variant="secondary" className="font-normal">
            {row.original.calculatorsCount || 0}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: t("investors.created_at") || "נוצר בתאריך",
      cell: ({ row }) => {
        return formatDate(row.original.createdAt || new Date());
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const investor = row.original;
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
                <Edit className="h-4 w-4 ml-2" />
                ערוך משקיע
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Trash className="h-4 w-4 ml-2" />
                מחק משקיע
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
        title={t("investors.title")}
        buttonText={t("investors.new")}
        onButtonClick={() => setCreateDialogOpen(true)}
      />
      
      <CreateInvestorDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {isLoading ? (
        <div className="text-center py-10">טוען משקיעים...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">
          דף זה זמין רק ליועצים. במידה ואתה יועץ ורואה הודעה זו, אנא פנה למנהל המערכת.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={investors || []}
          searchField="name"
          placeholder="חיפוש לפי שם..."
        />
      )}
    </MainLayout>
  );
}

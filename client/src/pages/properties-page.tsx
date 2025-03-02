import MainLayout from "@/components/layouts/main-layout";
import PageHeader from "@/components/ui/page-header";
import { useTranslation } from "@/hooks/use-locale";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Property } from "@shared/schema";

export default function PropertiesPage() {
  const { t } = useTranslation();

  // Fetch properties
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const columns: ColumnDef<Property>[] = [
    {
      accessorKey: "name",
      header: t("properties.name"),
    },
    {
      accessorKey: "priceWithoutVAT",
      header: t("properties.price"),
      cell: ({ row }) => {
        return formatCurrency(row.original.priceWithoutVAT, "EUR");
      },
    },
    {
      accessorKey: "monthlyRent",
      header: t("properties.rent"),
      cell: ({ row }) => {
        return formatCurrency(row.original.monthlyRent, "EUR");
      },
    },
    {
      accessorKey: "location",
      header: t("properties.location"),
    },
    {
      accessorKey: "bedrooms",
      header: t("properties.bedrooms"),
    },
    {
      accessorKey: "deliveryDate",
      header: t("properties.delivery_date"),
      cell: ({ row }) => {
        return formatDate(row.original.deliveryDate);
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const property = row.original;
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
                ערוך נכס
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Trash className="h-4 w-4 ml-2" />
                מחק נכס
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
        title={t("properties.title")}
        buttonText={t("properties.new")}
        onButtonClick={() => {}}
      />

      {isLoading ? (
        <div className="text-center py-10">טוען נכסים...</div>
      ) : (
        <DataTable
          columns={columns}
          data={properties || []}
          searchField="name"
          placeholder="חיפוש לפי שם או מיקום..."
        />
      )}
    </MainLayout>
  );
}

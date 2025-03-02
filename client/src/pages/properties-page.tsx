import MainLayout from "@/components/layouts/main-layout";
import PageHeader from "@/components/ui/page-header";
import { useTranslation } from "@/hooks/use-locale";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { useState } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { PropertyDialog } from "@/components/dialogs/property-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PropertiesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProperty, setEditProperty] = useState<Property | undefined>(undefined);
  const [deleteProperty, setDeleteProperty] = useState<Property | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch properties
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  // Delete property mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "נכס נמחק",
        description: "הנכס נמחק בהצלחה",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת מחיקת הנכס",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
    },
  });

  const handleEditProperty = (property: Property) => {
    setEditProperty(property);
    setDialogOpen(true);
  };

  const handleDeleteProperty = (property: Property) => {
    setDeleteProperty(property);
    setDeleteDialogOpen(true);
  };

  const handleAddProperty = () => {
    setEditProperty(undefined);
    setDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteProperty) {
      deleteMutation.mutate(deleteProperty.id);
    }
  };

  const columns: ColumnDef<Property>[] = [
    {
      accessorKey: "name",
      header: t("properties.name"),
    },
    {
      accessorKey: "priceWithoutVAT",
      header: t("properties.price"),
      cell: ({ row }) => {
        return formatCurrency(Number(row.original.priceWithoutVAT), "EUR");
      },
    },
    {
      accessorKey: "monthlyRent",
      header: t("properties.rent"),
      cell: ({ row }) => {
        return formatCurrency(Number(row.original.monthlyRent), "EUR");
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
              <DropdownMenuItem onClick={() => handleEditProperty(property)}>
                <Edit className="h-4 w-4 ml-2" />
                ערוך נכס
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteProperty(property)}
                className="text-red-600"
              >
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
        onButtonClick={handleAddProperty}
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

      {/* Property Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger className="hidden" />
        <PropertyDialog property={editProperty} setOpen={setDialogOpen} />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק לצמיתות את הנכס: {deleteProperty?.name}.
              פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse">
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

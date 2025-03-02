import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export type InvestmentStatus = 'available' | 'in_construction' | 'sold';

export interface InvestmentTableItem {
  id: number;
  propertyName: string;
  propertyDetails: string;
  location: string;
  price: number;
  monthlyRent: number;
  annualYield: number;
  status: InvestmentStatus;
}

interface InvestmentTableProps {
  title: string;
  investments: InvestmentTableItem[];
  onView: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  showViewAll?: boolean;
  viewAllLink?: string;
}

const InvestmentTable: React.FC<InvestmentTableProps> = ({
  title,
  investments,
  onView,
  onEdit,
  onDelete,
  showViewAll = false,
  viewAllLink = '/investments'
}) => {
  // Format currency with EUR symbol
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusBadge = (status: InvestmentStatus) => {
    switch (status) {
      case 'available':
        return <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">זמין</span>;
      case 'in_construction':
        return <span className="bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full">בבנייה</span>;
      case 'sold':
        return <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">נמכר</span>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        {showViewAll && (
          <a href={viewAllLink} className="text-primary hover:text-primary-dark text-sm">
            הצג הכל
          </a>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">שם הנכס</TableHead>
                <TableHead className="text-right">מיקום</TableHead>
                <TableHead className="text-right">מחיר (€)</TableHead>
                <TableHead className="text-right">שכירות חודשית (€)</TableHead>
                <TableHead className="text-right">תשואה שנתית</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.map((investment) => (
                <TableRow key={investment.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="font-medium">{investment.propertyName}</div>
                    <div className="text-xs text-muted-foreground">{investment.propertyDetails}</div>
                  </TableCell>
                  <TableCell>{investment.location}</TableCell>
                  <TableCell>{formatCurrency(investment.price)}</TableCell>
                  <TableCell>{formatCurrency(investment.monthlyRent)}</TableCell>
                  <TableCell>
                    <span className="text-green-600 font-medium">
                      {formatPercentage(investment.annualYield)}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(investment.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(investment.id)}
                        className="text-primary hover:text-primary-dark"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(investment.id)}>
                                ערוך
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem 
                                onClick={() => onDelete(investment.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                מחק
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentTable;

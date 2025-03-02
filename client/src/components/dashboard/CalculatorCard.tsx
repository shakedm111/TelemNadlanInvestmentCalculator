import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Link } from 'wouter';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export type CalculatorStatus = 'active' | 'draft' | 'archived';

interface CalculatorCardProps {
  id: number;
  investorId: number;
  name: string;
  status: CalculatorStatus;
  selfEquity: number;
  investmentOptions: number;
  updatedAt: Date;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

const CalculatorCard: React.FC<CalculatorCardProps> = ({
  id,
  investorId,
  name,
  status,
  selfEquity,
  investmentOptions,
  updatedAt,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  // Format date as DD/MM/YYYY
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Format currency with ILS symbol
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">פעיל</span>;
      case 'draft':
        return <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">טיוטה</span>;
      case 'archived':
        return <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">בארכיון</span>;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden border-t-4 border-primary">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-semibold text-lg">{name}</h3>
          {getStatusBadge()}
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">הון עצמי:</span>
            <span className="font-medium">{formatCurrency(selfEquity)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">אפשרויות השקעה:</span>
            <span className="font-medium">{investmentOptions}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">תאריך עדכון:</span>
            <span className="font-medium">{formatDate(updatedAt)}</span>
          </div>
        </div>
        
        <div className="flex space-x-2 space-x-reverse">
          <Link href={`/investors/${investorId}/calculators/${id}`}>
            <Button 
              variant="outline" 
              className="flex-1 text-primary border-primary hover:bg-primary hover:text-white"
            >
              פתח
            </Button>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  ערוך
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={onDuplicate}>
                  שכפל
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  מחק
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
};

export default CalculatorCard;

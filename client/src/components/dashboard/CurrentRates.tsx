import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

export interface Rate {
  id: string;
  label: string;
  value: string;
  change: number; // Percentage change
}

interface CurrentRatesProps {
  rates: Rate[];
  title?: string;
  lastUpdated?: Date;
}

const CurrentRates: React.FC<CurrentRatesProps> = ({ 
  rates, 
  title = 'שערים נוכחיים',
  lastUpdated
}) => {
  // Format date as DD/MM/YYYY HH:MM
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rates.map((rate) => (
            <div key={rate.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">{rate.label}</p>
                  <p className="font-semibold">{rate.value}</p>
                </div>
                <div className={`
                  flex items-center
                  ${rate.change > 0 ? 'text-green-500' : rate.change < 0 ? 'text-red-500' : 'text-gray-500'}
                `}>
                  {rate.change > 0 ? (
                    <TrendingUp className="h-4 w-4 ml-1" />
                  ) : rate.change < 0 ? (
                    <TrendingDown className="h-4 w-4 ml-1" />
                  ) : (
                    <Minus className="h-4 w-4 ml-1" />
                  )}
                  <span className="text-sm">{Math.abs(rate.change).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {lastUpdated && (
          <p className="text-xs text-gray-500 text-center mt-4">
            עודכן לאחרונה: {formatDateTime(lastUpdated)}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentRates;

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Calculator, ChartPieIcon, Wallet } from 'lucide-react';

type StatCardType = 'investor-info' | 'calculator-count' | 'properties-count' | 'analyses-count';

interface StatCardProps {
  type: StatCardType;
  value: string | number;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ type, value, label }) => {
  const getIcon = () => {
    switch (type) {
      case 'investor-info':
        return {
          icon: <Wallet className="h-5 w-5" />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-500'
        };
      case 'calculator-count':
        return {
          icon: <Calculator className="h-5 w-5" />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-500'
        };
      case 'properties-count':
        return {
          icon: <Building2 className="h-5 w-5" />,
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-500'
        };
      case 'analyses-count':
        return {
          icon: <ChartPieIcon className="h-5 w-5" />,
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-500'
        };
      default:
        return {
          icon: <Calculator className="h-5 w-5" />,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-500'
        };
    }
  };

  const { icon, bgColor, textColor } = getIcon();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center ${textColor}`}>
            {icon}
          </div>
          <div className="mr-4">
            <p className="text-gray-500 text-sm">{label}</p>
            <h3 className="text-xl font-semibold">{value}</h3>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;

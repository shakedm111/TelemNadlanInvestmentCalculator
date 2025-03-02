import React, { useEffect, useRef } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ComparisonData {
  name: string;
  investments: Array<{
    name: string;
    color: string;
    values: {
      [key: string]: number;
    };
  }>;
  metrics: Array<{
    key: string;
    label: string;
  }>;
}

interface ComparisonChartProps {
  data: ComparisonData;
  title: string;
  description?: string;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ 
  data, 
  title,
  description
}) => {
  const [selectedMetric, setSelectedMetric] = React.useState<string>(
    data.metrics[0]?.key || 'yield'
  );
  
  // Transform data for recharts
  const chartData = data.investments.map(investment => {
    return {
      name: investment.name,
      value: investment.values[selectedMetric],
      color: investment.color
    };
  });

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const currentMetric = data.metrics.find(m => m.key === selectedMetric);
      
      return (
        <div className="bg-white p-3 shadow rounded border">
          <p className="font-semibold">{label}</p>
          <p className="text-sm">
            {currentMetric?.label}: {payload[0].value}
          </p>
        </div>
      );
    }
  
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2">
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="mt-4 md:mt-0">
          <Select
            value={selectedMetric}
            onValueChange={setSelectedMetric}
          >
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="בחר מדד" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המדדים</SelectItem>
              {data.metrics.map((metric) => (
                <SelectItem key={metric.key} value={metric.key}>
                  {metric.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 40,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#666' }} 
                tickLine={false}
                axisLine={{ stroke: '#eee' }}
              />
              <YAxis 
                tick={{ fill: '#666' }} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]} 
                isAnimationActive={true}
              >
                {chartData.map((entry, index) => (
                  <rect 
                    key={`bar-${index}`} 
                    fill={entry.color} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          {data.investments.map((investment, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: investment.color }}
              />
              <span className="text-sm">{investment.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComparisonChart;

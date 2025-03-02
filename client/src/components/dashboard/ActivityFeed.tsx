import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calculator, ChartLineUp, FilePdf } from 'lucide-react';

export interface Activity {
  id: number;
  type: 'calculator_created' | 'analysis_created' | 'investment_added' | 'report_created';
  title: string;
  description: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  activities: Activity[];
  title?: string;
  showMore?: boolean;
  onShowMore?: () => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  activities, 
  title = 'פעילות אחרונה',
  showMore = false,
  onShowMore
}) => {
  // Format relative time (e.g., "2 hours ago")
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return diffDays === 1 ? 'אתמול' : `לפני ${diffDays} ימים`;
    }
    if (diffHours > 0) {
      return diffHours === 1 ? 'לפני שעה' : `לפני ${diffHours} שעות`;
    }
    if (diffMins > 0) {
      return diffMins === 1 ? 'לפני דקה' : `לפני ${diffMins} דקות`;
    }
    return 'עכשיו';
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'calculator_created':
        return {
          icon: <Calculator className="h-4 w-4" />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-500'
        };
      case 'analysis_created':
        return {
          icon: <ChartLineUp className="h-4 w-4" />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-500'
        };
      case 'investment_added':
        return {
          icon: <Building2 className="h-4 w-4" />,
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-500'
        };
      case 'report_created':
        return {
          icon: <FilePdf className="h-4 w-4" />,
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-500'
        };
      default:
        return {
          icon: <Calculator className="h-4 w-4" />,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-500'
        };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const { icon, bgColor, textColor } = getActivityIcon(activity.type);
            
            return (
              <div key={activity.id} className="flex items-start">
                <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center ${textColor} mt-1`}>
                  {icon}
                </div>
                <div className="mr-3 flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">{activity.title}</p>
                    <span className="text-xs text-gray-500">{getRelativeTime(activity.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        {showMore && (
          <button 
            onClick={onShowMore} 
            className="block w-full text-center text-primary hover:text-primary-dark text-sm mt-4"
          >
            הצג עוד פעילות
          </button>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface PageHeaderProps {
  title: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export default function PageHeader({ 
  title, 
  buttonText, 
  onButtonClick 
}: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {buttonText && (
        <Button 
          onClick={onButtonClick} 
          className="bg-primary text-white hover:bg-primary/90"
        >
          <PlusCircle className="h-5 w-5 ml-2" />
          {buttonText}
        </Button>
      )}
    </div>
  );
}

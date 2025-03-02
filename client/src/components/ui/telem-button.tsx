import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TelemButtonProps extends ButtonProps {
  children: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const TelemButton: React.FC<TelemButtonProps> = ({
  children,
  className,
  iconLeft,
  iconRight,
  variant = "default",
  ...props
}) => {
  return (
    <Button
      variant={variant}
      className={cn(
        "inline-flex items-center font-medium",
        variant === "default" && "bg-telem-primary hover:bg-telem-primary-dark",
        className
      )}
      {...props}
    >
      {iconRight && <span className="mr-2">{iconRight}</span>}
      {children}
      {iconLeft && <span className="ml-2">{iconLeft}</span>}
    </Button>
  );
};

export default TelemButton;

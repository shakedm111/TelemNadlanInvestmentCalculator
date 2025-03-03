import React from "react";

export const TelemLogo: React.FC<{ className?: string }> = ({ className = "h-10" }) => {
  return (
    <img 
      src="/telem-logo.png" 
      alt="תלם נדל״ן לוגו" 
      className={`${className} object-contain w-auto`} 
    />
  );
};

export default TelemLogo;

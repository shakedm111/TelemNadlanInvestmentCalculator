import React from "react";
import telemLogo from "../assets/telem-logo.png";

export const TelemLogo: React.FC<{ className?: string }> = ({ className = "h-10" }) => {
  return (
    <img 
      src={telemLogo} 
      alt="תלם נדל״ן לוגו" 
      className={`${className} object-contain w-auto`} 
    />
  );
};

export default TelemLogo;

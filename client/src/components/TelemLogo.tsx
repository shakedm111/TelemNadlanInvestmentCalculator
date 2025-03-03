import React from 'react';

interface TelemLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const TelemLogo: React.FC<TelemLogoProps> = ({ className = '', size = 'md' }) => {
  const sizes = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
  };

  const heightClass = sizes[size];

  return (
    <img 
      src="/telem-logo.png" 
      alt="תלם נדל״ן לוגו" 
      className={`${heightClass} ${className} object-contain`} 
    />
  );
};

export default TelemLogo;

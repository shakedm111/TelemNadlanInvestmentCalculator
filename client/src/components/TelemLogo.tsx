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

  return (
    <svg 
      className={`${sizes[size]} ${className}`} 
      viewBox="0 0 240 80" 
      xmlns="http://www.w3.org/2000/svg"
      aria-labelledby="telemLogoTitle"
    >
      <title id="telemLogoTitle">תלם נדל"ן לוגו</title>
      <path fill="#35B0AB" d="M60 40h40v40H60z" />
      <path fill="#aaaaaa" d="M60 40h-40v40h40z" />
      <path fill="#35B0AB" d="M20 20h40v40H20z" />
      <path fill="#aaaaaa" d="M20 20h-20v40h20z" />
      <g fill="#666666" transform="translate(120, 45)">
        <path d="M0 0h12v2H0zm16 0h12v2H16zm16 0h12v2H32zm16 0h12v2H48zm16 0h12v2H64z" />
        <text x="88" y="0" fontSize="18" fontWeight="500">NADLAN</text>
      </g>
    </svg>
  );
};

export default TelemLogo;

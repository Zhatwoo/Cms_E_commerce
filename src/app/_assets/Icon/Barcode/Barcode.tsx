import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Barcode: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M4 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M7 4V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M13 4V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M16 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M19 4V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
};

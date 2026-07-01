import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Truck: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M10 17H1V5H14V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 8H18L23 13V17H14V8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
};

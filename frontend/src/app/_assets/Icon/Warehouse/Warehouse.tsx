import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Warehouse: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M3 10L12 4L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 10V20H19V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 14H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};

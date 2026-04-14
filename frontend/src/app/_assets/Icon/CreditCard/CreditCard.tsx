import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const CreditCard: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M2 10H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 15H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Banknote: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2"/>
      <path d="M6 9H6.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M18 15H18.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};

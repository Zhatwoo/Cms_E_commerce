import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const PercentOff: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M5 19L19 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
};

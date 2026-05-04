import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Scan: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M4 7V5C4 4.44772 4.44772 4 5 4H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M17 4H19C19.5523 4 20 4.44772 20 5V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 17V19C20 19.5523 19.5523 20 19 20H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M7 20H5C4.44772 20 4 19.5523 4 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};

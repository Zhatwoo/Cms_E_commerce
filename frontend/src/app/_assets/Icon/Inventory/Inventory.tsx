import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Inventory: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="3" y="4" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
      <rect x="13" y="4" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
      <rect x="3" y="13" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
      <rect x="13" y="13" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
};

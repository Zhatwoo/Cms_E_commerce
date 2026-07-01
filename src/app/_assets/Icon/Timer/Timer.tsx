import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Timer: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 13L15.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 5V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};

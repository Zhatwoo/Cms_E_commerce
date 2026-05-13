import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Refund: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 9H10.5C9.67157 9 9 9.67157 9 10.5C9 11.3284 9.67157 12 10.5 12H13.5C14.3284 12 15 12.6716 15 13.5C15 14.3284 14.3284 15 13.5 15H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 7V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M15 15V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};

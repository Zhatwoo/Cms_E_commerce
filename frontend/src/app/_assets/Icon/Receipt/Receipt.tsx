import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Receipt: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M6 2L8 4L10 2L12 4L14 2L16 4L18 2V22L16 20L14 22L12 20L10 22L8 20L6 22V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 16H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const MailSupport: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M3 8L12 13L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 16H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};

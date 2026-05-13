import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Headset: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="3" y="11" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="2"/>
      <rect x="17" y="11" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M20 18C20 19.6569 18.6569 21 17 21H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};

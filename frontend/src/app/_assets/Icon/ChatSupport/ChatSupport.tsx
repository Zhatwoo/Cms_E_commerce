import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const ChatSupport: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M21 12C21 16.4183 16.9706 20 12 20C10.5076 20 9.10006 19.6771 7.86667 19.1056L3 20L4.06667 16.0889C3.38707 14.9114 3 13.5026 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 9H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};

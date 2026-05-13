import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Gift: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="3" y="8" width="18" height="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 8V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M19 12V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 8H9.5C8.67157 8 8 7.32843 8 6.5C8 5.67157 8.67157 5 9.5 5C11 5 12 6.2 12 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 8H14.5C15.3284 8 16 7.32843 16 6.5C16 5.67157 15.3284 5 14.5 5C13 5 12 6.2 12 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

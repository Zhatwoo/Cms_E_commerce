import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Verified: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M12 3L14.5 5.1L17.8 5L18.9 8.1L21 10.6L19.3 13.5L19.7 16.8L16.5 17.7L14.3 20.2L11.1 19.3L8.1 20.4L6.4 17.6L3.5 16L4 12.8L3 9.7L5.6 7.9L7 5L10.3 5.2L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.7 12L11 14.3L15.3 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

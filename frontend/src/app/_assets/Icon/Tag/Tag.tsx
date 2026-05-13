import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Tag: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M20.59 13.41L11 23L1 13L10.59 3.41C10.9641 3.03695 11.4709 2.82739 12 2.82739C12.5291 2.82739 13.0359 3.03695 13.41 3.41L20.59 10.59C20.963 10.9641 21.1726 11.4709 21.1726 12C21.1726 12.5291 20.963 13.0359 20.59 13.41Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/>
    </svg>
  );
};

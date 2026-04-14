import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const PhoneCall: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M22 16.92V20C22 20.5523 21.5523 21 21 21C11.6112 21 4 13.3888 4 4C4 3.44772 4.44772 3 5 3H8.09C8.57 3 8.98 3.34 9.07 3.81L9.78 7.35C9.86 7.77 9.72 8.2 9.41 8.5L7.41 10.5C8.68 13.08 10.92 15.32 13.5 16.59L15.5 14.59C15.8 14.28 16.23 14.14 16.65 14.22L20.19 14.93C20.66 15.02 21 15.43 21 15.91V16.92" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 4C17.7614 4 20 6.23858 20 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};

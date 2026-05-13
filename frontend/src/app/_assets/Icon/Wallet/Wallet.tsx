import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Wallet: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M2 7C2 5.89543 2.89543 5 4 5H18C19.1046 5 20 5.89543 20 7V9H15C13.8954 9 13 9.89543 13 11V13C13 14.1046 13.8954 15 15 15H20V17C20 18.1046 19.1046 19 18 19H4C2.89543 19 2 18.1046 2 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 9H15C13.8954 9 13 9.89543 13 11V13C13 14.1046 13.8954 15 15 15H20C21.1046 15 22 14.1046 22 13V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="16" cy="12" r="1" fill="currentColor"/>
    </svg>
  );
};

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const ShoppingBasket: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M17 9L19.6 3.8C19.7 3.6 19.9 3.5 20 3.5C20.2 3.5 20.4 3.6 20.5 3.8L23 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1 9L3.5 3.8C3.6 3.6 3.8 3.5 4 3.5C4.1 3.5 4.3 3.6 4.4 3.8L7 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.8 9H20.2C21.2 9 22 9.8 22 10.8L20.4 19.2C20.3 19.9 19.7 20.5 19 20.5H5C4.3 20.5 3.7 19.9 3.6 19.2L2 10.8C2 9.8 2.8 9 3.8 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 13H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

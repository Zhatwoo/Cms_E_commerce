import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Coupon: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M21 8.5C19.6193 8.5 18.5 9.61929 18.5 11C18.5 12.3807 19.6193 13.5 21 13.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V13.5C4.38071 13.5 5.5 12.3807 5.5 11C5.5 9.61929 4.38071 8.5 3 8.5V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 7H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/>
      <path d="M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/>
    </svg>
  );
};

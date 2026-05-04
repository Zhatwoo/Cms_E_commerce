import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const QrCode: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="3" y="3" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
      <rect x="15" y="3" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
      <rect x="3" y="15" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
      <path d="M15 15H17V17H15V15Z" fill="currentColor"/>
      <path d="M19 15H21V19H19V15Z" fill="currentColor"/>
      <path d="M15 19H18V21H15V19Z" fill="currentColor"/>
    </svg>
  );
};

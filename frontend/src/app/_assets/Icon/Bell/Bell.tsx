import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Bell: React.FC<IconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M14.857 17H9.143M18 17V11C18 7.13401 15.3137 4 12 4C8.68629 4 6 7.13401 6 11V17L4 19H20L18 17ZM13.73 21C13.5543 21.3031 13.3021 21.5547 12.9985 21.7295C12.6949 21.9044 12.3506 21.9962 12 21.9956C11.6494 21.9962 11.3051 21.9044 11.0015 21.7295C10.6979 21.5547 10.4457 21.3031 10.27 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

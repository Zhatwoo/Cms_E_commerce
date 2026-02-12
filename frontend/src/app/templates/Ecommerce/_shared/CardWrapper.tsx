"use client";

import React from "react";

interface CardWrapperProps {
  children: React.ReactNode;
  backgroundColor?: string;
  borderRadius?: number;
  borderColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CardWrapper: React.FC<CardWrapperProps> = ({
  children,
  backgroundColor = "#ffffff",
  borderRadius = 12,
  borderColor = "#e2e8f0",
  className = "",
  style,
}) => (
  <div
    className={className}
    style={{
      backgroundColor,
      borderRadius: `${borderRadius}px`,
      border: `1px solid ${borderColor}`,
      ...style,
    }}
  >
    {children}
  </div>
);

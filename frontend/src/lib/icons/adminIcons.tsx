import React from 'react';

type IconProps = {
  className?: string;
  strokeWidth?: number;
};

export function SearchIcon({ className = 'h-5 w-5', strokeWidth = 2 }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

export function ChevronDownIcon({ className = 'h-5 w-5', strokeWidth = 2 }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function ExternalLinkIcon({ className = 'h-5 w-5', strokeWidth = 2 }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

export function StorageIcon({ className = 'h-5 w-5', strokeWidth = 2 }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="6" cy="12" r="1" fill="currentColor" />
      <circle cx="6" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

export function LogoutIcon({ className = 'w-5 h-5', strokeWidth = 2 }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

export function CloseIcon({ className = 'w-5 h-5', strokeWidth = 2 }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function CheckIcon({ className = 'h-4 w-4', strokeWidth = 2 }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M3.5 8.5L6.5 11.5L12.5 4.5" />
    </svg>
  );
}

export function TrashOutlineIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M2.5 4.5h11" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6 2.75h4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M5 4.5v7.25a1 1 0 001 1h4a1 1 0 001-1V4.5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6.75 6.75v3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9.25 6.75v3.5" />
    </svg>
  );
}

export function RestoreIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M5 5H2.75V2.75" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M2.75 5a5.25 5.25 0 109.45 3.15" />
    </svg>
  );
}

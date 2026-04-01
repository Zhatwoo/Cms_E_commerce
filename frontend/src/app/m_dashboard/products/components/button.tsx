import React from 'react';

export interface AddProductButtonProps {
  onClick: () => void;
  disabled: boolean;
  title?: string;
}

export function AddProductButton({
  onClick,
  disabled,
  title = 'Add product',
}: AddProductButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-[46px] px-4 rounded-xl border flex items-center justify-center text-[13px] font-bold ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
      }`}
      style={{
        background: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)',
        borderColor: 'transparent',
        color: '#ffffff',
      }}
      title={title}
    >
      + Add Product
    </button>
  );
}

export interface SaveProductButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  loadingText: string;
  actionText: string;
  isLight: boolean;
}

export function SaveProductButton({
  onClick,
  disabled,
  loading,
  loadingText,
  actionText,
  isLight,
}: SaveProductButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-8 h-10 rounded-2xl font-semibold text-sm leading-none text-white transition-all ${
        loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:brightness-110 active:scale-95'
      }`}
      style={{
        background: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)',
        color: '#FFFFFF',
        boxShadow: '0 10px 24px rgba(217,70,239,0.4)',
      }}
    >
      {loading ? loadingText : actionText}
    </button>
  );
}

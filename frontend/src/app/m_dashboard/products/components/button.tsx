import React from 'react';
import { useTheme } from '../../components/context/theme-context';
import { Plus } from 'lucide-react';

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
  const { theme } = useTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-2 px-3 py-5.5 rounded-xl text-xs font-bold transition-all hover:-translate-y-1 hover:brightness-110 active:scale-95 disabled:opacity-70"
      style={{
              background: theme === 'dark' ? '#FACC15' :'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)',
              color: theme === 'dark' ? '#120533' : '#FFFFFF',
              boxShadow: theme === 'dark'
                ? '0 8px 24px rgba(255, 206, 0, 0.42)'
                : '0 8px 24px rgba(217,70,239,0.4)',
            }}
      title={title}
    >
     <Plus className="w-3.5 h-3.5" />  Add Product
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

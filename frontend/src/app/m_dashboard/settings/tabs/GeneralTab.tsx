import type React from 'react';
import { motion } from 'framer-motion';
import { AtSign, Camera, Check, FileText, Globe, Save, User } from 'lucide-react';

type GeneralForm = {
  name: string;
  email: string;
  username: string;
  website: string;
  bio: string;
};

type Feedback = { type: 'success' | 'error'; message: string } | null;

type GeneralTabProps = {
  colors: Record<string, any>;
  theme: 'light' | 'dark';
  user: any;
  avatarUrl: string;
  generalForm: GeneralForm;
  generalFeedback: Feedback;
  generalSaving: boolean;
  avatarUploading: boolean;
  generalSaveSuccess: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFieldChange: (field: keyof GeneralForm, value: string) => void;
  onReset: () => void;
  onSave: () => void;
};

export function GeneralTab({
  colors,
  theme,
  user,
  avatarUrl,
  generalForm,
  generalFeedback,
  generalSaving,
  avatarUploading,
  generalSaveSuccess,
  fileInputRef,
  onAvatarChange,
  onFieldChange,
  onReset,
  onSave,
}: GeneralTabProps) {
  const isDark = theme === 'dark';

  const profileFields: Array<{
    label: string;
    value: string;
    key: keyof GeneralForm;
    type: 'text' | 'url' | 'email';
    placeholder: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    sub?: string;
  }> = [
    { label: 'Display Name', value: generalForm.name, key: 'name', type: 'text', placeholder: 'Legal or Chosen name', icon: User },
    { label: 'Username', value: generalForm.username, key: 'username', type: 'text', placeholder: '@handle', icon: AtSign },
    { label: 'Website', value: generalForm.website, key: 'website', type: 'url', placeholder: 'https://', icon: Globe },
    {
      label: 'Email Address',
      value: generalForm.email,
      key: 'email',
      type: 'email',
      placeholder: 'you@agency.com',
      icon: AtSign,
      sub: 'Read-only security mode',
    },
  ];

  return (
      <>
  {/* SECTION HEADER: Editorial Spacing & Typography */}
  <div className="mb-12">
    <div className="flex items-center gap-3 mb-2">
      <div className={`w-1 h-6 rounded-full ${isDark ? 'bg-violet-500' : 'bg-violet-600'}`} />
      <h2 className="text-2xl font-black uppercase tracking-tight" style={{ color: colors.text.primary }}>
        General Profile
      </h2>
    </div>
    <p className="text-sm font-medium opacity-60 leading-relaxed max-w-md" style={{ color: colors.text.secondary }}>
      Refine your digital presence. Manage account identity, visual markers, and professional biography.
    </p>
  </div>

  {/* FEEDBACK TOAST: Floating & Modern */}
  {generalFeedback && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-4 rounded-2xl border backdrop-blur-md flex items-center gap-3 text-[13px] font-bold uppercase tracking-wider"
      style={{
        backgroundColor: generalFeedback.type === 'success' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
        borderColor: generalFeedback.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
        color: generalFeedback.type === 'success' ? colors.status.good : colors.status.error,
      }}
    >
      <div className={`w-2 h-2 rounded-full animate-pulse ${generalFeedback.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {generalFeedback.message}
    </motion.div>
  )}

  {/* IDENTITY CARD: Glassmorphic Hub */}
  <div
    className="relative group flex flex-col md:flex-row items-center gap-8 p-8 mb-12 rounded-[2.5rem] border transition-all duration-500"
    style={{ 
      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', 
      borderColor: colors.border.faint 
    }}
  >
    <div className="relative">
      <div className="absolute inset-0 rounded-full blur-2xl opacity-20 bg-linear-to-tr from-violet-500 to-pink-500 group-hover:opacity-40 transition-opacity" />
      <img
        src={avatarUrl}
        alt="Avatar"
        className="w-32 h-32 rounded-full object-cover border-4 relative z-10 transition-transform duration-500 group-hover:scale-[1.02]"
        style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF' }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={generalSaving || avatarUploading}
        className="absolute bottom-1 right-1 w-10 h-10 rounded-full flex items-center justify-center border-2 z-20 shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-60"
        style={{ backgroundColor: colors.bg.card, borderColor: colors.border.default, color: colors.text.primary }}
      >
        {avatarUploading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Camera className="w-5 h-5" />
        )}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
    </div>

    <div className="text-center md:text-left min-w-0 grow">
      <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1 block">Account Identity</span>
      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter leading-tight wrap-break-word mb-1" style={{ color: colors.text.primary }}>
        {generalForm.name || 'User'}
      </h3>
      <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
        <p className="text-sm font-medium opacity-60 italic" style={{ color: colors.text.secondary }}>
          {generalForm.email || 'No email'}
        </p>
        <div className="h-1 w-1 rounded-full bg-white/20 hidden md:block" />
        <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10" style={{ color: colors.text.muted }}>
          Est. {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2026'}
        </p>
      </div>
    </div>
  </div>

  {/* INPUT GRID: Clean & Minimalist */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 mb-12">
    {profileFields.map((field) => (
      <div key={field.key} className="group">
        <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 opacity-50 group-focus-within:opacity-100 transition-opacity" style={{ color: colors.text.primary }}>
          {field.label}
        </label>
        <div className="relative">
          <field.icon
            className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:opacity-100 group-focus-within:text-violet-500 transition-all ${
              isDark ? 'text-white' : 'text-slate-700'
            }`}
          />
          <input
            type={field.type}
            value={field.value}
            readOnly={field.key === 'email'}
            onChange={(e) => onFieldChange(field.key, e.target.value)}
            className={`w-full pl-12 pr-4 py-4 rounded-[1.25rem] border outline-none transition-all font-medium text-sm
              ${field.key === 'email' ? 'opacity-50 cursor-not-allowed' : 'focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500/30'}
            `}
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
              borderColor: colors.border.faint,
              color: colors.text.primary,
            }}
            placeholder={field.placeholder}
          />
        </div>
        {field.sub && <p className="text-[10px] italic mt-2 ml-1 opacity-40">{field.sub}</p>}
      </div>
    ))}
  </div>

  {/* BIO AREA: High-Density Canvas */}
  <div className="mb-12">
    <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 opacity-50" style={{ color: colors.text.primary }}>
      Biography
    </label>
    <div className="relative group">
      <FileText
        className={`absolute left-5 top-5 w-4 h-4 opacity-40 group-focus-within:opacity-100 group-focus-within:text-violet-500 transition-all ${
          isDark ? 'text-white' : 'text-slate-700'
        }`}
      />
      <textarea
        rows={5}
        value={generalForm.bio}
        onChange={(e) => onFieldChange('bio', e.target.value)}
        className="w-full pl-12 pr-14 py-4 rounded-[1.25rem] border outline-none transition-all font-medium text-sm focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500/30"
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
          borderColor: colors.border.faint,
          color: colors.text.primary,
        }}
        placeholder="Brief professional summary..."
      />
      <div className="absolute bottom-4 right-6 flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-widest opacity-30">
          {Math.max(0, 240 - (generalForm.bio?.length || 0))} / 240
        </span>
      </div>
    </div>
  </div>

  {/* ACTION FOOTER: Premium Fixed-Style Strip */}
  <div className="pt-10 border-t flex flex-col-reverse md:flex-row items-center justify-between gap-y-3" style={{ borderColor: colors.border.faint }}>
     <button
      type="button"
      onClick={onReset}
      className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2"
      style={{ color: colors.text.secondary }}
    >
      Discard Changes
    </button>
    
    <button
      onClick={onSave}
      disabled={generalSaving || !generalForm.name.trim() || !generalForm.email.trim()}
      className={`relative group flex items-center gap-3 px-10 py-4 rounded-full cursor-pointer transition-all duration-300 ease-out active:scale-95 disabled:opacity-50 hover:-translate-y-1 hover:brightness-110 ${
        isDark ? 'hover:shadow-[0_12px_28px_rgba(255,206,0,0.55)]' : 'hover:shadow-[0_12px_28px_rgba(217,70,239,0.5)]'
      }`}
      style={
        isDark
          ? {
              background: '#FFCE00',
              color: '#120533',
              boxShadow: '0 8px 24px rgba(255, 206, 0, 0.42)',
            }
          : {
              background: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)',
              boxShadow: '0 8px 24px rgba(217,70,239,0.4)',
            }
      }
    >
      <div className="relative z-10 flex items-center gap-3">
        {generalSaveSuccess && !generalSaving ? <Check className={`w-4 h-4 ${isDark ? 'text-[#120533]' : 'text-white'}`} /> : <Save className={`w-4 h-4 ${isDark ? 'text-[#120533]' : 'text-white'}`} />}
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-[#120533]' : 'text-white'}`}>
          {generalSaving ? 'Syncing...' : generalSaveSuccess ? 'Identity Verified' : 'Publish Profile'}
        </span>
      </div>
    </button>
  </div>
</>
  );
}

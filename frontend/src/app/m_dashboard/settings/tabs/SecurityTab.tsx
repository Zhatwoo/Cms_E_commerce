import { Check, Eye, EyeOff, Lock, Save, ShieldCheck } from 'lucide-react';

type SecurityTabProps = {
  colors: Record<string, any>;
  theme: string;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  saveSuccess: boolean;
  onSave: () => void;
};

export function SecurityTab({ colors, theme, showPassword, setShowPassword, saveSuccess, onSave }: SecurityTabProps) {
  return (
    <>
    <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
        <div className={`w-1 h-6 rounded-full ${theme === 'dark' ? 'bg-violet-500' : 'bg-violet-600'}`} />
        <h2 className="text-2xl font-black uppercase tracking-tight" style={{ color: colors.text.primary }}>
            Security Settings
        </h2>
        </div>
        <p className="text-sm font-medium opacity-60 leading-relaxed max-w-md" style={{ color: colors.text.secondary }}>
        Manage your access credentials and reinforce your account with multi-layer authentication.
        </p>
    </div>

    <div className="space-y-8 mb-12">
        {[
        { label: 'Current Password', key: 'current' },
        { label: 'New Password', key: 'new' },
        { label: 'Confirm New Password', key: 'confirm' }
        ].map((field, idx) => (
        <div key={field.key} className="group">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 opacity-50 group-focus-within:opacity-100 transition-opacity" style={{ color: colors.text.primary }}>
            {field.label}
            </label>
            <div className="relative">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20 group-focus-within:opacity-100 group-focus-within:text-violet-500 transition-all" />
            <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full pl-16 pr-14 py-4 rounded-[1.25rem] border outline-none transition-all font-medium text-sm focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500/30"
                style={{
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                borderColor: colors.border.faint,
                color: colors.text.primary,
                }}
            />
            {idx === 0 && (
                <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100 transition-opacity"
                style={{ color: colors.text.muted }}
                >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            )}
            </div>
        </div>
        ))}
    </div>

    <div className="mb-12 pt-10 border-t" style={{ borderColor: colors.border.faint }}>
        <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-6 ml-1 opacity-50" style={{ color: colors.text.primary }}>
        Advanced Protection
        </label>
        <div 
        className="flex flex-col md:flex-row items-center justify-between p-8 rounded-[2.5rem] border transition-all duration-500"
        style={{ 
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', 
            borderColor: colors.border.faint 
        }}
        >
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/5 flex items-center justify-center border border-violet-500/10">
            <ShieldCheck className="w-7 h-7 text-violet-500 opacity-80" />
            </div>
            <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <h4 className="font-black tracking-tight" style={{ color: colors.text.primary }}>Two-Factor Auth</h4>
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            </div>
            <p className="text-xs font-medium opacity-40 italic">Status: Disabled</p>
            </div>
        </div>
        
        <button
            className="mt-6 md:mt-0 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#803BED] text-white transition-all hover:opacity-80 active:scale-95"
        >
            Enable 2FA
        </button>
        </div>
    </div>

    <div className="pt-10 border-t flex items-center justify-between" style={{ borderColor: colors.border.faint }}>
        <button
        type="button"
        className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity"
        style={{ color: colors.text.secondary }}
        >
        Discard Changes
        </button>
        
        <button
        onClick={onSave}
        className="relative group flex items-center gap-3 px-10 py-4 rounded-full overflow-hidden transition-all active:scale-95 shadow-lg shadow-violet-500/20"
        >
        <div className="absolute inset-0 bg-gradient-to-r from-[#9333ea] to-[#ec4899] group-hover:opacity-90 transition-opacity" />
        <div className="relative z-10 flex items-center gap-3">
            {saveSuccess ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4 text-white" />}
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
            {saveSuccess ? 'Security Verified' : 'Update Credentials'}
            </span>
        </div>
        </button>
    </div>
    </>
  );
}

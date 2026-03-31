"use client";

import { AnimatePresence, motion } from 'framer-motion';
import { Globe, Layout, X, Loader2 } from 'lucide-react';

/// A high-end, editorial modal for editing project configuration.
/// 
/// Designed with a focus on typography and clean spacing, this component 
/// adapts to Light and Dark modes while maintaining a professional SaaS aesthetic.
///
/// Parameters:
/// - [isOpen]: Controls the animation lifecycle of the modal.
/// - [theme]: Current UI mode ('light' | 'dark').
/// - [projectName]: The original name of the project being edited.
/// - [title]: The current value of the project name input.
/// - [subdomain]: The current value of the subdomain input.
/// - [error]: Optional validation message to display.
/// - [saving]: Loading state for the primary action button.
/// - [onTitleChange]: Callback for the name input.
/// - [onSubdomainChange]: Callback for the subdomain input.
/// - [onCancel]: Dismisses the modal.
/// - [onSave]: Executes the update logic.

type DashboardTheme = 'light' | 'dark';

type EditProjectModalProps = {
  isOpen: boolean;
  theme: DashboardTheme;
  projectName: string;
  title: string;
  subdomain: string;
  error?: string;
  saving: boolean;
  onTitleChange: (value: string) => void;
  onSubdomainChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function EditProjectModal({
  isOpen,
  theme,
  projectName,
  title,
  subdomain,
  error,
  saving,
  onTitleChange,
  onSubdomainChange,
  onCancel,
  onSave,
}: EditProjectModalProps) {
  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-[8px]"
          style={{ 
            backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(15, 23, 42, 0.25)' 
          }}
          onClick={() => !saving && onCancel()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className={`w-full max-w-[480px] rounded-[32px] overflow-hidden border transition-all duration-300
              ${isDark ? 'bg-[#15093E] border-[#272261] shadow-[0_30px_90px_rgba(0,0,0,0.6)]' 
                       : 'bg-[#F9FAFB] border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.08)]'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Lowered Contrast for Eye Comfort */}
            <div className={`px-8 pt-8 pb-6 flex items-start justify-between border-b 
              ${isDark ? 'border-white/5' : 'border-slate-200/50'}`}>
              <div>
                <h3 className={`text-xl font-black tracking-tight
                  ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Edit Project
                </h3>
                <p className={`text-[10px] font-bold uppercase tracking-[0.15em] mt-1 opacity-50
                  ${isDark ? 'text-[#8A8FC4]' : 'text-slate-500'}`}>
                  Updating: {projectName}
                </p>
              </div>
              <button 
                onClick={onCancel}
                className={`cursor-pointer p-2 rounded-xl transition-all hover:bg-slate-500/5
                  ${isDark ? 'text-white/30 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-7">
              <div className="space-y-6">
                {/* Project Name Field */}
                <div className="group">
                  <label className={`text-[9px] font-black uppercase tracking-[0.2em] mb-2.5 block
                    ${isDark ? 'text-[#8A8FC4]' : 'text-slate-400'}`}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className={`w-full px-5 py-3.5 rounded-2xl border text-sm font-medium transition-all outline-none
                      ${isDark ? 'border-[#2A2A60] bg-[#0A0826] text-white focus:border-[#6B72D8]' 
                               : 'border-slate-200 bg-white/50 text-slate-900 focus:bg-white focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/5'}`}
                    placeholder="Untitled Project"
                    autoFocus
                  />
                </div>

                {/* Subdomain Field */}
                <div className="group">
                  <label className={`text-[9px] font-black uppercase tracking-[0.2em] mb-2.5 block
                    ${isDark ? 'text-[#8A8FC4]' : 'text-slate-400'}`}>
                    Subdomain
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={subdomain}
                      onChange={(e) => onSubdomainChange(e.target.value)}
                      className={`w-full px-5 py-3.5 rounded-2xl border text-sm font-medium transition-all outline-none
                        ${isDark ? 'border-[#2A2A60] bg-[#0A0826] text-white focus:border-[#6B72D8]' 
                                 : 'border-slate-200 bg-white/50 text-slate-900 focus:bg-white focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/5'}`}
                      placeholder="my-store"
                    />
                  </div>
                  <p className={`text-[10px] mt-2.5 ml-1 font-medium opacity-40
                    ${isDark ? 'text-[#6B6FA0]' : 'text-slate-500'}`}>
                    Letters, numbers, and hyphens only.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-bold text-center">
                  {error}
                </div>
              )}

              {/* Action Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={saving}
                  className={`cursor-pointer px-5 h-11 rounded-2xl text-xs font-black uppercase tracking-widest transition-all
                    ${isDark ? 'text-[#8A8FC4] hover:bg-white/5' : 'text-slate-400 hover:text-slate-800'}`}
                >
                  Cancel
                </button>
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className={`
                        cursor-pointer relative order-1 sm:order-2 flex items-center justify-center px-8 h-11 rounded-2xl 
                        text-xs font-black uppercase tracking-[0.15em] transition-all
                        /* Text & Background */
                        text-[#121241] bg-[#FFCE00] hover:bg-[#FFD740] 
                        /* Interaction */
                        active:scale-95 disabled:opacity-50
                        /* THE FIX: Professional Shadow instead of Yellow Glow */
                        ${isDark 
                        ? 'shadow-[0_10px_30px_rgba(255,206,0,0.1)]' 
                        : 'shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(15,23,42,0.1)]'
                        }
                    `}
                    >
                    {saving ? 'Saving' : 'Save Changes'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
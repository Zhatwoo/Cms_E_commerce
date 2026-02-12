// Hindi to accessible sa sidebar, sa header lang sya 

'use client';
import React, { useState, useRef, useEffect } from 'react';
import { updateProfile } from '@/lib/api';
import { useAuth } from '../components/context/auth-context';
import { useTheme } from '../components/context/theme-context';
import { motion } from 'framer-motion';

// Icons
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const CreditCardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);

const SaveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser } = useAuth();
  const { colors, theme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Felix");
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    website: '',
    bio: ''
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      // Use avatar from backend if available, otherwise fallback to dicebear
      setAvatarUrl(user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        username: user.name?.toLowerCase().replace(/\s/g, '') || '',
        website: 'https://mercato.tools',
        bio: 'Building the future of commerce. Love React, Three.js, and good coffee.'
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      // Note: Backend currently only supports updating 'name' and 'avatar'
      const res = await updateProfile({
        name: formData.name,
        avatar: avatarUrl // Sends the base64 string or URL
      });

      if (res.success && res.user) {
        setUser(res.user);
        setFeedback({ type: 'success', message: 'Profile updated successfully!' });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Failed to update profile' });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (error: any) {
      console.error("Failed to update profile", error);
      setFeedback({ type: 'error', message: error.message || 'Connection error' });
      setTimeout(() => setFeedback(null), 3000);
    }
    setIsLoading(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setAvatarUrl(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8" style={{ color: colors.text.secondary }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text.primary }}>Account Settings</h1>
        <p style={{ color: colors.text.muted }}>Manage your personal information, security preferences, and billing.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <motion.div
          className="lg:col-span-3 space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <nav className="flex flex-col gap-1">
            {[
              { id: 'general', label: 'General', icon: UserIcon },
              { id: 'security', label: 'Security', icon: ShieldIcon },
              { id: 'notifications', label: 'Notifications', icon: BellIcon },
              { id: 'billing', label: 'Billing', icon: CreditCardIcon },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${activeTab === item.id
                  ? 'shadow-sm'
                  : 'border-transparent'
                  }`}
                style={{
                  backgroundColor: activeTab === item.id ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                  color: activeTab === item.id
                    ? (theme === 'dark' ? '#C4B5FD' : '#7C3AED')
                    : colors.text.muted,
                  borderColor: activeTab === item.id ? 'rgba(124, 58, 237, 0.2)' : 'transparent'
                }}
              >
                <item.icon />
                <span>{item.label}</span>
                {activeTab === item.id && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400"
                  />
                )}
              </button>
            ))}
          </nav>
        </motion.div>

        {/* Main Content */}
        <motion.div
          className="lg:col-span-9"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="backdrop-blur-md border rounded-2xl p-6 shadow-xl relative overflow-hidden"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(30, 30, 30, 0.4)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: colors.border.faint
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-sky-500/5 pointer-events-none" />

            {activeTab === 'general' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8 relative"
              >
                {/* Feedback Notification */}
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-between shadow-lg mb-6`}
                    style={{
                      backgroundColor: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      borderColor: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: feedback.type === 'success' ? colors.status.good : colors.status.error
                    }}
                  >
                    <span>{feedback.message}</span>
                    <button onClick={() => setFeedback(null)} className="opacity-50 hover:opacity-100">✕</button>
                  </motion.div>
                )}

                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b"
                  style={{ borderColor: colors.border.faint }}
                >
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 p-[2px]">
                      <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: colors.bg.dark }}
                      >
                        <img
                          src={avatarUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Fixed camera button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 rounded-full border transition-all shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                      style={{
                        backgroundColor: colors.bg.elevated,
                        borderColor: colors.border.default,
                        color: colors.text.secondary
                      }}
                    >
                      <CameraIcon />
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-semibold" style={{ color: colors.text.primary }}>{formData.name || user?.name || 'User'}</h3>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>{formData.email || user?.email || 'Loading...'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"
                        style={{
                          backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(22, 163, 74, 0.1)',
                          color: colors.status.good,
                          borderColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(22, 163, 74, 0.2)'
                        }}
                      >
                        Pro Plan
                      </span>
                      <span className="text-xs" style={{ color: colors.text.subtle }}>Member since 2021</span>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.subtle }}>Display Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your Name"
                      className="w-full border rounded-lg px-4 py-2.5 transition-all focus:outline-none focus:ring-1 focus:ring-violet-500"
                      style={{
                        backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.5)',
                        borderColor: colors.border.faint,
                        color: colors.text.primary
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.subtle }}>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      className="w-full border rounded-lg px-4 py-2.5 transition-all focus:outline-none focus:ring-1 focus:ring-violet-500"
                      style={{
                        backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.5)',
                        borderColor: colors.border.faint,
                        color: colors.text.primary
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.subtle }}>Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5" style={{ color: colors.text.subtle }}>@</span>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="username"
                        className="w-full border rounded-lg pl-8 pr-4 py-2.5 transition-all focus:outline-none focus:ring-1 focus:ring-violet-500"
                        style={{
                          backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.5)',
                          borderColor: colors.border.faint,
                          color: colors.text.primary
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.subtle }}>Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://your-website.com"
                      className="w-full border rounded-lg px-4 py-2.5 transition-all focus:outline-none focus:ring-1 focus:ring-violet-500"
                      style={{
                        backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.5)',
                        borderColor: colors.border.faint,
                        color: colors.text.primary
                      }}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.subtle }}>Bio</label>
                    <textarea
                      name="bio"
                      rows={4}
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us a little about yourself..."
                      className="w-full border rounded-lg px-4 py-2.5 transition-all resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
                      style={{
                        backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.5)',
                        borderColor: colors.border.faint,
                        color: colors.text.primary
                      }}
                    />
                    <p className="text-xs text-right" style={{ color: colors.text.subtle }}>{240 - formData.bio.length} characters left</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t" style={{ borderColor: colors.border.faint }}>
                  <button
                    className="px-4 py-2 text-sm font-medium transition-colors"
                    style={{ color: colors.text.muted }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/20"
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <SaveIcon />
                    )}
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            )}


            {(activeTab === 'notifications' || activeTab === 'billing' || activeTab === 'security') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center"
                style={{ color: colors.text.muted }}
              >
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center border-2 border-dashed rotate-12 transition-transform hover:rotate-0 duration-500"
                    style={{
                      backgroundColor: colors.bg.elevated,
                      borderColor: colors.border.default,
                      boxShadow: theme === 'dark' ? '0 20px 40px rgba(0,0,0,0.4)' : '0 10px 20px rgba(0,0,0,0.05)'
                    }}
                  >
                    <span className="text-4xl -rotate-12 transition-transform group-hover:rotate-0">
                      {activeTab === 'security' ? '🔐' : activeTab === 'billing' ? '💳' : '�'}
                    </span>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-lg border-4"
                    style={{ borderColor: colors.bg.card }}
                  >
                    !
                  </motion.div>
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight" style={{ color: colors.text.primary }}>
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} is in the works
                </h3>
                <p className="max-w-xs text-sm leading-relaxed mx-auto italic" style={{ color: colors.text.secondary }}>
                  "Great things take time. We&apos;re building a secure and seamless {activeTab} experience just for you."
                </p>
                <button
                  className="mt-8 px-6 py-2 rounded-full text-xs font-semibold border transition-all hover:scale-105"
                  style={{
                    borderColor: colors.border.default,
                    color: colors.text.primary,
                    backgroundColor: colors.bg.card
                  }}
                  onClick={() => setActiveTab('general')}
                >
                  Return to General
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
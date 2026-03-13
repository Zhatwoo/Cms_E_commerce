'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';
import { 
    Bell, 
    Shield, 
    Palette, 
    Code, 
    CreditCard,
    ChevronRight,
    Save,
    Lock,
    Eye,
    EyeOff,
    Check,
    Moon,
    Sun
} from 'lucide-react';

type SettingTab = 'notifications' | 'security' | 'appearance' | 'billing';

export default function SettingsPage() {
    const { colors, theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<SettingTab>('notifications');
    const [showPassword, setShowPassword] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Notification settings state
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [orderNotifications, setOrderNotifications] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);
    const [securityAlerts, setSecurityAlerts] = useState(true);

    const tabs = [
        { id: 'notifications' as SettingTab, label: 'Notifications', icon: Bell },
        { id: 'security' as SettingTab, label: 'Security', icon: Shield },
        { id: 'appearance' as SettingTab, label: 'Appearance', icon: Palette },
        { id: 'billing' as SettingTab, label: 'Billing', icon: CreditCard },
    ];

    const handleSave = () => {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 1500);
    };

    return (
        <div className="relative space-y-6 [font-family:var(--font-outfit),sans-serif]">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div
                    className="absolute left-[12%] top-[80px] h-[280px] w-[280px] rounded-full opacity-20 blur-3xl"
                    style={{ backgroundColor: colors.accent.purpleDeep }}
                />
                <div
                    className="absolute right-[14%] top-[120px] h-[240px] w-[240px] rounded-full opacity-20 blur-3xl"
                    style={{ backgroundColor: colors.accent.yellow }}
                />
            </div>
            {/* Header */}
            <section className="relative z-10 mb-3 text-center pt-2 pb-1">
                <motion.h1
                    className="text-[40px] sm:text-[54px] lg:text-[66px] font-extrabold leading-[0.98] tracking-tight"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <span
                        className="text-transparent bg-clip-text"
                        style={{ backgroundImage: theme === 'dark' ? 'linear-gradient(90deg, #6702BF 14%, #B36760 48%, #FFCC00 78%)' : 'linear-gradient(90deg, #8B5CF6 0%, #D946EF 100%)' }}
                    >
                        Settings
                    </span>
                </motion.h1>
                <motion.p
                    className="mx-auto mt-2 max-w-[760px] text-sm md:text-base"
                    style={{ color: colors.text.secondary }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.42, delay: 0.08 }}
                >
                    Manage your account settings and preferences in one place.
                </motion.p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <div 
                        className="rounded-2xl border p-2 space-y-1"
                        style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
                    >
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                                        isActive ? 'shadow-sm' : 'hover:bg-opacity-50'
                                    }`}
                                    style={{
                                        backgroundColor: isActive ? colors.bg.elevated : 'transparent',
                                        color: isActive ? colors.text.primary : colors.text.secondary,
                                    }}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="flex-1 font-medium">{tab.label}</span>
                                    {isActive && <ChevronRight className="w-4 h-4" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-2xl border p-6 space-y-6"
                        style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
                    >
                        {/* Notifications Settings */}
                        {activeTab === 'notifications' && (
                            <>
                                <div>
                                    <h2 className="text-xl font-semibold mb-1" style={{ color: colors.text.primary }}>
                                        Notification Preferences
                                    </h2>
                                    <p className="text-sm" style={{ color: colors.text.muted }}>
                                        Choose how you want to be notified about activity
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start justify-between py-3 border-b" style={{ borderColor: colors.border.faint }}>
                                        <div className="flex-1">
                                            <h3 className="font-medium mb-1" style={{ color: colors.text.primary }}>
                                                Email Notifications
                                            </h3>
                                            <p className="text-sm" style={{ color: colors.text.muted }}>
                                                Receive email updates about your account
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setEmailNotifications(!emailNotifications)}
                                            className="relative w-12 h-6 rounded-full transition-colors"
                                            style={{ backgroundColor: emailNotifications ? (theme === 'dark' ? '#B13BFF' : '#8B5CF6') : 'rgba(148,163,184,0.5)' }}
                                        >
                                            <span
                                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                                    emailNotifications ? 'translate-x-6' : ''
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    <div className="flex items-start justify-between py-3 border-b" style={{ borderColor: colors.border.faint }}>
                                        <div className="flex-1">
                                            <h3 className="font-medium mb-1" style={{ color: colors.text.primary }}>
                                                Order Updates
                                            </h3>
                                            <p className="text-sm" style={{ color: colors.text.muted }}>
                                                Get notified when orders are placed or updated
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setOrderNotifications(!orderNotifications)}
                                            className="relative w-12 h-6 rounded-full transition-colors"
                                            style={{ backgroundColor: orderNotifications ? (theme === 'dark' ? '#B13BFF' : '#8B5CF6') : 'rgba(148,163,184,0.5)' }}
                                        >
                                            <span
                                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                                    orderNotifications ? 'translate-x-6' : ''
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    <div className="flex items-start justify-between py-3 border-b" style={{ borderColor: colors.border.faint }}>
                                        <div className="flex-1">
                                            <h3 className="font-medium mb-1" style={{ color: colors.text.primary }}>
                                                Marketing Emails
                                            </h3>
                                            <p className="text-sm" style={{ color: colors.text.muted }}>
                                                Receive tips, promotions, and updates
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setMarketingEmails(!marketingEmails)}
                                            className="relative w-12 h-6 rounded-full transition-colors"
                                            style={{ backgroundColor: marketingEmails ? (theme === 'dark' ? '#B13BFF' : '#8B5CF6') : 'rgba(148,163,184,0.5)' }}
                                        >
                                            <span
                                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                                    marketingEmails ? 'translate-x-6' : ''
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    <div className="flex items-start justify-between py-3">
                                        <div className="flex-1">
                                            <h3 className="font-medium mb-1" style={{ color: colors.text.primary }}>
                                                Security Alerts
                                            </h3>
                                            <p className="text-sm" style={{ color: colors.text.muted }}>
                                                Important notifications about your account security
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setSecurityAlerts(!securityAlerts)}
                                            className="relative w-12 h-6 rounded-full transition-colors"
                                            style={{ backgroundColor: securityAlerts ? (theme === 'dark' ? '#B13BFF' : '#8B5CF6') : 'rgba(148,163,184,0.5)' }}
                                        >
                                            <span
                                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                                    securityAlerts ? 'translate-x-6' : ''
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t" style={{ borderColor: colors.border.faint }}>
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium transition-opacity hover:opacity-85"
                                        style={{ background: theme === 'dark' ? 'linear-gradient(90deg, #B13BFF 0%, #B36760 50%, #FFCC00 100%)' : 'linear-gradient(90deg, #8B5CF6 0%, #D946EF 100%)', textShadow: theme === 'dark' ? 'unset' : '0 1px 2px rgba(0,0,0,0.1)' }}
                                    >
                                        {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        {saveSuccess ? 'Saved!' : 'Save Preferences'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Security Settings */}
                        {activeTab === 'security' && (
                            <>
                                <div>
                                    <h2 className="text-xl font-semibold mb-1" style={{ color: colors.text.primary }}>
                                        Security Settings
                                    </h2>
                                    <p className="text-sm" style={{ color: colors.text.muted }}>
                                        Manage your password and security preferences
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.text.muted }} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                className="w-full pl-11 pr-11 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                                                style={{
                                                    backgroundColor: colors.bg.elevated,
                                                    borderColor: colors.border.faint,
                                                    color: colors.text.primary,
                                                }}
                                            />
                                            <button
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                                style={{ color: colors.text.muted }}
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.text.muted }} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                className="w-full pl-11 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                                                style={{
                                                    backgroundColor: colors.bg.elevated,
                                                    borderColor: colors.border.faint,
                                                    color: colors.text.primary,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.text.muted }} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                className="w-full pl-11 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                                                style={{
                                                    backgroundColor: colors.bg.elevated,
                                                    borderColor: colors.border.faint,
                                                    color: colors.text.primary,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t" style={{ borderColor: colors.border.faint }}>
                                        <h3 className="font-medium mb-3" style={{ color: colors.text.primary }}>
                                            Two-Factor Authentication
                                        </h3>
                                        <div 
                                            className="p-4 rounded-lg border"
                                            style={{ backgroundColor: colors.bg.elevated, borderColor: colors.border.faint }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-sm" style={{ color: colors.text.primary }}>
                                                        Status: Not Enabled
                                                    </p>
                                                    <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                                                        Add an extra layer of security to your account
                                                    </p>
                                                </div>
                                                <button className="px-4 py-2 rounded-lg border hover:bg-opacity-50 transition-colors text-sm font-medium"
                                                    style={{ borderColor: colors.border.faint, color: colors.text.primary }}
                                                >
                                                    Enable
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t" style={{ borderColor: colors.border.faint }}>
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium transition-opacity hover:opacity-85"
                                        style={{ background: theme === 'dark' ? 'linear-gradient(90deg, #B13BFF 0%, #B36760 50%, #FFCC00 100%)' : 'linear-gradient(90deg, #8B5CF6 0%, #D946EF 100%)', textShadow: theme === 'dark' ? 'unset' : '0 1px 2px rgba(0,0,0,0.1)' }}
                                    >
                                        {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        {saveSuccess ? 'Saved!' : 'Update Password'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Appearance Settings */}
                        {activeTab === 'appearance' && (
                            <>
                                <div>
                                    <h2 className="text-xl font-semibold mb-1" style={{ color: colors.text.primary }}>
                                        Appearance
                                    </h2>
                                    <p className="text-sm" style={{ color: colors.text.muted }}>
                                        Customize how your dashboard looks
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-medium mb-3" style={{ color: colors.text.primary }}>
                                            Theme
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => theme === 'dark' && toggleTheme()}
                                                className={`p-4 rounded-lg border-2 transition-all ${
                                                    theme === 'light' ? 'border-violet-500' : 'border-transparent'
                                                }`}
                                                style={{ 
                                                    backgroundColor: colors.bg.elevated,
                                                    borderColor: theme === 'light' ? '#B13BFF' : colors.border.faint
                                                }}
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Sun className="w-5 h-5 text-yellow-500" />
                                                    <span className="font-medium" style={{ color: colors.text.primary }}>
                                                        Light
                                                    </span>
                                                </div>
                                                <div className="h-16 rounded bg-white border" style={{ borderColor: colors.border.faint }}>
                                                    <div className="h-1/3 bg-gray-100 border-b" style={{ borderColor: colors.border.faint }} />
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => theme === 'light' && toggleTheme()}
                                                className={`p-4 rounded-lg border-2 transition-all ${
                                                    theme === 'dark' ? 'border-violet-500' : 'border-transparent'
                                                }`}
                                                style={{ 
                                                    backgroundColor: colors.bg.elevated,
                                                    borderColor: theme === 'dark' ? '#B13BFF' : colors.border.faint
                                                }}
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Moon className="w-5 h-5 text-blue-500" />
                                                    <span className="font-medium" style={{ color: colors.text.primary }}>
                                                        Dark
                                                    </span>
                                                </div>
                                                <div className="h-16 rounded bg-gray-900 border border-gray-800">
                                                    <div className="h-1/3 bg-gray-800 border-b border-gray-700" />
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-medium mb-3" style={{ color: colors.text.primary }}>
                                            Accent Color
                                        </h3>
                                        <div className="flex gap-3">
                                            {['#B13BFF', '#B36760', '#FFCC00', '#22C55E', '#38BDF8', '#F97316'].map((color) => (
                                                <button
                                                    key={color}
                                                    className="w-12 h-12 rounded-lg border-2 hover:scale-110 transition-transform"
                                                    style={{ 
                                                        backgroundColor: color,
                                                        borderColor: color === '#B13BFF' ? colors.text.primary : 'transparent'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}


                                <div className="space-y-4">
                                    <div 
                                        className="p-4 rounded-lg border"
                                        style={{ backgroundColor: colors.bg.elevated, borderColor: colors.border.faint }}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-medium" style={{ color: colors.text.primary }}>
                                                    Production API Key
                                                </h3>
                                                <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                                                    Last used 2 days ago
                                                </p>
                                            </div>
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-600">
                                                Active
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3">
                                            <code 
                                                className="flex-1 px-3 py-2 rounded border text-sm font-mono"
                                                style={{ 
                                                    backgroundColor: colors.bg.elevated,
                                                    borderColor: colors.border.faint,
                                                    color: colors.text.secondary
                                                }}
                                            >
                                                sk_live_••••••••••••••••1234
                                            </code>
                                            <button className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-85"
                                                style={{ background: theme === 'dark' ? 'linear-gradient(90deg, #B13BFF 0%, #B36760 50%, #FFCC00 100%)' : 'linear-gradient(90deg, #8B5CF6 0%, #D946EF 100%)', textShadow: theme === 'dark' ? 'unset' : '0 1px 2px rgba(0,0,0,0.1)' }}>
                                                Copy
                                            </button>
                                        </div>
                                    </div>

                                    <div 
                                        className="p-4 rounded-lg border"
                                        style={{ backgroundColor: colors.bg.elevated, borderColor: colors.border.faint }}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-medium" style={{ color: colors.text.primary }}>
                                                    Development API Key
                                                </h3>
                                                <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                                                    Last used 5 hours ago
                                                </p>
                                            </div>
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-600">
                                                Active
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3">
                                            <code 
                                                className="flex-1 px-3 py-2 rounded border text-sm font-mono"
                                                style={{ 
                                                    backgroundColor: colors.bg.elevated,
                                                    borderColor: colors.border.faint,
                                                    color: colors.text.secondary
                                                }}
                                            >
                                                sk_test_••••••••••••••••5678
                                            </code>
                                            <button className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-85"
                                                style={{ background: theme === 'dark' ? 'linear-gradient(90deg, #B13BFF 0%, #B36760 50%, #FFCC00 100%)' : 'linear-gradient(90deg, #8B5CF6 0%, #D946EF 100%)', textShadow: theme === 'dark' ? 'unset' : '0 1px 2px rgba(0,0,0,0.1)' }}>
                                                Copy
                                            </button>
                                        </div>
                                    </div>

                                    <button className="w-full py-3 rounded-lg border-2 border-dashed hover:bg-opacity-50 transition-colors text-sm font-medium"
                                        style={{ borderColor: colors.border.faint, color: colors.text.secondary }}
                                    >
                                        + Create New API Key
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Billing Settings */}
                        {activeTab === 'billing' && (
                            <>
                                <div>
                                    <h2 className="text-xl font-semibold mb-1" style={{ color: colors.text.primary }}>
                                        Billing & Subscription
                                    </h2>
                                    <p className="text-sm" style={{ color: colors.text.muted }}>
                                        Manage your subscription and payment methods
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div 
                                        className="p-6 rounded-lg border"
                                        style={{ backgroundColor: colors.bg.elevated, borderColor: colors.border.faint }}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                                                    Professional Plan
                                                </h3>
                                                <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
                                                    Billed monthly
                                                </p>
                                            </div>
                                            <span className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                                                ₱49<span className="text-sm font-normal">/mo</span>
                                            </span>
                                        </div>
                                        <div className="flex gap-3">
                                            <button className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-85"
                                                style={{ background: theme === 'dark' ? 'linear-gradient(90deg, #B13BFF 0%, #B36760 50%, #FFCC00 100%)' : 'linear-gradient(90deg, #8B5CF6 0%, #D946EF 100%)', textShadow: theme === 'dark' ? 'unset' : '0 1px 2px rgba(0,0,0,0.1)' }}>
                                                Upgrade Plan
                                            </button>
                                            <button className="px-4 py-2 rounded-lg border hover:bg-opacity-50 transition-colors text-sm font-medium"
                                                style={{ borderColor: colors.border.faint, color: colors.text.primary }}
                                            >
                                                Cancel Subscription
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-medium mb-3" style={{ color: colors.text.primary }}>
                                            Payment Method
                                        </h3>
                                        <div 
                                            className="p-4 rounded-lg border flex items-center justify-between"
                                            style={{ backgroundColor: colors.bg.elevated, borderColor: colors.border.faint }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-8 rounded bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                                    VISA
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm" style={{ color: colors.text.primary }}>
                                                        •••• •••• •••• 4242
                                                    </p>
                                                    <p className="text-xs" style={{ color: colors.text.muted }}>
                                                        Expires 12/2025
                                                    </p>
                                                </div>
                                            </div>
                                            <button className="px-3 py-1.5 rounded-lg border hover:bg-opacity-50 transition-colors text-sm"
                                                style={{ borderColor: colors.border.faint, color: colors.text.secondary }}
                                            >
                                                Update
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-medium mb-3" style={{ color: colors.text.primary }}>
                                            Billing History
                                        </h3>
                                        <div className="space-y-2">
                                            {[
                                                { date: 'Jan 1, 2026', amount: '₱49.00', status: 'Paid' },
                                                { date: 'Dec 1, 2025', amount: '₱49.00', status: 'Paid' },
                                                { date: 'Nov 1, 2025', amount: '₱49.00', status: 'Paid' },
                                            ].map((invoice, i) => (
                                                <div
                                                    key={i}
                                                    className="p-3 rounded-lg border flex items-center justify-between"
                                                    style={{ backgroundColor: colors.bg.elevated, borderColor: colors.border.faint }}
                                                >
                                                    <div>
                                                        <p className="font-medium text-sm" style={{ color: colors.text.primary }}>
                                                            {invoice.date}
                                                        </p>
                                                        <p className="text-xs" style={{ color: colors.text.muted }}>
                                                            Invoice #{1234567 + i}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-medium" style={{ color: colors.text.primary }}>
                                                            {invoice.amount}
                                                        </span>
                                                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-600">
                                                            {invoice.status}
                                                        </span>
                                                        <button className="text-sm hover:underline" style={{ color: colors.accent.yellow }}>
                                                            Download
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}


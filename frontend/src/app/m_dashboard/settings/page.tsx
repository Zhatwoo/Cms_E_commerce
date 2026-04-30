'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';
import { getMe, updateProfile, uploadAvatarApi, type User as ApiUser, getUnionBankLink, getPayPalLink } from '@/lib/api';
import { TabBar, type TabBarItem } from '../components/ui/tabbar';
import { AddCardModal } from './components/AddCardModal';
import { GeneralTab } from './tabs/GeneralTab';
import { NotificationsTab } from './tabs/NotificationsTab';
import { SecurityTab } from './tabs/SecurityTab';
import { BillingTab } from './tabs/BillingTab';

type SettingTab = 'general' | 'notifications' | 'security' | 'billing';

const SETTINGS_TABS: readonly TabBarItem<SettingTab>[] = [
    { id: 'general', label: 'GENERAL' },
    { id: 'notifications', label: 'NOTIFICATIONS' },
    { id: 'security', label: 'SECURITY' },
    { id: 'billing', label: 'BILLING' },
];


export default function SettingsPage() {
    const { colors, theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState<SettingTab>('general');
    const [showPassword, setShowPassword] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [generalSaveSuccess, setGeneralSaveSuccess] = useState(false);
    const [generalSaving, setGeneralSaving] = useState(false);
    const [generalForm, setGeneralForm] = useState({
        name: '',
        email: '',
        username: '',
        website: '',
        bio: '',
    });
    const [generalFeedback, setGeneralFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [avatarUrl, setAvatarUrl] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=User');
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
    const [pendingAvatarPreviewUrl, setPendingAvatarPreviewUrl] = useState<string | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Notification settings state
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [orderNotifications, setOrderNotifications] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);
    const [securityAlerts, setSecurityAlerts] = useState(true);

    // User & Billing state
    const [user, setUser] = useState<ApiUser | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLinking, setIsLinking] = useState(false);
    const [removingCardId, setRemovingCardId] = useState<string | null>(null);
    const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);

    const searchParams = useSearchParams();

    useEffect(() => {
        const tabParam = searchParams.get('tab') as SettingTab | null;
        if (tabParam && ['general', 'notifications', 'security', 'billing'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await getMe();
                if (response && response.success && response.user) {
                    setUser(response.user);
                    setPaymentMethods(response.user.paymentMethods || []);
                }
            } catch (error) {
                console.error('Failed to fetch user:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (!user) return;
        setGeneralForm({
            name: user.name || '',
            email: user.email || '',
            username: user.username || user.name?.toLowerCase().replace(/\s/g, '') || '',
            website: user.website || '',
            bio: user.bio || '',
        });
        if (!pendingAvatarFile) {
            setAvatarUrl(user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'User'}`);
        }
    }, [user]);

    useEffect(() => {
        return () => {
            if (pendingAvatarPreviewUrl) URL.revokeObjectURL(pendingAvatarPreviewUrl);
        };
    }, [pendingAvatarPreviewUrl]);

    const handleAddCard = () => {
        setIsAddCardModalOpen(true);
    };

    const handleAddCardSuccess = (updatedMethods: any[]) => {
        setPaymentMethods(updatedMethods);
        setIsAddCardModalOpen(false);
    };

    const handleLinkPayPal = async () => {
        const email = window.prompt('Pakilagay ang iyong PayPal email address para sa pagtanggap ng bayad:');
        if (!email) return;

        // Simple validation
        if (!email.includes('@') || email.length < 5) {
            alert('Mali ang format ng email. Pakisubukan muli.');
            return;
        }

        setIsLinking(true);
        try {
            const newMethod = {
                id: `paypal_${Date.now()}`,
                type: 'paypal',
                email: email.trim(),
                linkedAt: new Date().toISOString()
            };

            // Siguraduhing walang duplicate na paypal entry
            const otherMethods = paymentMethods.filter(m => m.type !== 'paypal');
            const updatedMethods = [...otherMethods, newMethod];

            const response = await updateProfile({ paymentMethods: updatedMethods });
            if (response && response.success && response.user) {
                setPaymentMethods(response.user.paymentMethods || []);
            } else {
                alert('Hindi ma-save ang PayPal email. Pakisubukan muli.');
            }
        } catch (error) {
            console.error('Failed to link PayPal manually:', error);
            alert('Nagkaroon ng problema sa pag-save. Pakisubukan muli.');
        } finally {
            setIsLinking(false);
        }
    };

    const handleLinkUnionBank = async () => {
        if (isLinking) return;
        setIsLinking(true);
        try {
            const res = await getUnionBankLink();
            if (res.success && res.url) {
                window.location.href = res.url;
            } else {
                alert('Failed to get UnionBank link. Please try again.');
            }
        } catch (error) {
            console.error('Failed to link UnionBank:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsLinking(false);
        }
    };

    const handleRemoveCard = async (id: string) => {
        if (!window.confirm('Sigurado ka bang nais mong tanggalin ang payment method na ito?')) {
            return;
        }

        setRemovingCardId(id);

        try {
            const updatedMethods = paymentMethods.filter(card => card.id !== id);
            // Optimistically update local state
            setPaymentMethods(updatedMethods);

            const response = await updateProfile({ paymentMethods: updatedMethods });

            if (!response.success) {
                // If failed, revert to original methods
                console.error('Failed to update profile on backend');
                setPaymentMethods(paymentMethods);
                alert('Hindi matanggal ang card. Pakisubukan muli.');
            }
        } catch (error) {
            console.error('Failed to remove card:', error);
            alert('Nagkaroon ng problema. Pakisubukan muli.');
        } finally {
            setRemovingCardId(null);
        }
    };

    const handleSave = () => {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 1500);
    };

    const handleSaveGeneral = async () => {
        const trimmedName = generalForm.name.trim();
        const trimmedEmail = generalForm.email.trim();
        if (!trimmedName || !trimmedEmail) return;

        setGeneralSaving(true);
        setAvatarUploading(Boolean(pendingAvatarFile));
        setGeneralFeedback(null);
        try {
            let avatarToSave: string | undefined;
            if (pendingAvatarFile) {
                const uploadRes = await uploadAvatarApi(pendingAvatarFile);
                if (!uploadRes.success || !uploadRes.url) {
                    throw new Error(uploadRes.message || 'Avatar upload failed');
                }
                avatarToSave = uploadRes.url;
            }

            const response = await updateProfile({
                name: trimmedName,
                username: generalForm.username.trim() || undefined,
                website: generalForm.website.trim() || undefined,
                bio: generalForm.bio.trim() || undefined,
                ...(avatarToSave !== undefined ? { avatar: avatarToSave } : {}),
            });

            if (response?.success && response.user) {
                setUser(response.user);
                if (pendingAvatarPreviewUrl) URL.revokeObjectURL(pendingAvatarPreviewUrl);
                setPendingAvatarPreviewUrl(null);
                setPendingAvatarFile(null);
                setAvatarUrl(response.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${response.user.email || 'User'}`);
                setGeneralFeedback({ type: 'success', message: 'Profile updated successfully.' });
                setGeneralSaveSuccess(true);
                setTimeout(() => setGeneralSaveSuccess(false), 1500);
            } else {
                setGeneralFeedback({ type: 'error', message: response?.message || 'Failed to update profile.' });
            }
        } catch (error) {
            console.error('Failed to save general settings:', error);
            const message = error instanceof Error ? error.message : 'Failed to update profile.';
            setGeneralFeedback({ type: 'error', message });
        } finally {
            setAvatarUploading(false);
            setGeneralSaving(false);
        }
    };

    const handleGeneralReset = () => {
        if (!user) return;
        if (pendingAvatarPreviewUrl) URL.revokeObjectURL(pendingAvatarPreviewUrl);
        setPendingAvatarPreviewUrl(null);
        setPendingAvatarFile(null);
        setGeneralFeedback(null);
        setGeneralForm({
            name: user.name || '',
            email: user.email || '',
            username: user.username || user.name?.toLowerCase().replace(/\s/g, '') || '',
            website: user.website || '',
            bio: user.bio || '',
        });
        setAvatarUrl(user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'User'}`);
    };

    const handleGeneralAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setGeneralFeedback({ type: 'error', message: 'Please choose an image file.' });
            return;
        }

        if (pendingAvatarPreviewUrl) URL.revokeObjectURL(pendingAvatarPreviewUrl);
        const previewUrl = URL.createObjectURL(file);
        setPendingAvatarPreviewUrl(previewUrl);
        setPendingAvatarFile(file);
        setAvatarUrl(previewUrl);
        setGeneralFeedback({ type: 'success', message: 'Avatar selected. Save changes to apply.' });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleGeneralFieldChange = (field: keyof typeof generalForm, value: string) => {
        setGeneralForm((prev) => ({ ...prev, [field]: value }));
    };

    const renderActiveTab = () => {
        if (activeTab === 'general') {
            return (
                <GeneralTab
                    colors={colors}
                    theme={theme}
                    user={user}
                    avatarUrl={avatarUrl}
                    generalForm={generalForm}
                    generalFeedback={generalFeedback}
                    generalSaving={generalSaving}
                    avatarUploading={avatarUploading}
                    generalSaveSuccess={generalSaveSuccess}
                    fileInputRef={fileInputRef}
                    onAvatarChange={handleGeneralAvatarChange}
                    onFieldChange={handleGeneralFieldChange}
                    onReset={handleGeneralReset}
                    onSave={handleSaveGeneral}
                />
            );
        }

        if (activeTab === 'notifications') {
            return (
                <NotificationsTab
                    colors={colors}
                    theme={theme}
                    emailNotifications={emailNotifications}
                    orderNotifications={orderNotifications}
                    marketingEmails={marketingEmails}
                    securityAlerts={securityAlerts}
                    setEmailNotifications={setEmailNotifications}
                    setOrderNotifications={setOrderNotifications}
                    setMarketingEmails={setMarketingEmails}
                    setSecurityAlerts={setSecurityAlerts}
                    saveSuccess={saveSuccess}
                    onSave={handleSave}
                />
            );
        }

        if (activeTab === 'security') {
            return (
                <SecurityTab
                    colors={colors}
                    theme={theme}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    saveSuccess={saveSuccess}
                    onSave={handleSave}
                />
            );
        }

        if (activeTab === 'billing') {
            return (
                <BillingTab
                    colors={colors}
                    theme={theme}
                    paymentMethods={paymentMethods}
                    isLinking={isLinking}
                    removingCardId={removingCardId}
                    onAddCard={handleAddCard}
                    onRemoveCard={handleRemoveCard}
                    onLinkUnionBank={handleLinkUnionBank}
                    onLinkPayPal={handleLinkPayPal}
                />
            );
        }

        return null;
    };

    return (
        <div className="dashboard-landing-light relative min-h-[calc(100vh-176px)] px-5 py-8 lg:px-40 [font-family:var(--font-outfit),sans-serif]">
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-150 rounded-full opacity-[0.08] blur-[120px]"
                    style={{ background: 'radial-gradient(circle, #7C3AED, #D946EF, transparent)' }}
                />
            </div>

            <section className="text-center py-4 mb-7">
                <motion.h1
                    className="text-4xl sm:text-6xl lg:text-[76px] font-black tracking-[-1.8px] leading-[1.2] [font-family:var(--font-outfit),sans-serif]"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ color: colors.text.primary }}
                >
                    My{' '}
                    <span
                        className={`inline-block text-transparent bg-clip-text bg-linear-to-r ${theme === 'dark' ? 'from-[#7c3aed] via-[#d946ef] to-[#ffcc00]' : 'from-[#7c3aed] via-[#d946ef] to-[#f5a213]'}`}
                        style={{ paddingBottom: '0.1em', marginBottom: '-0.1em' }}
                    >
                        Settings
                    </span>
                </motion.h1>    
            </section>

            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-center mb-12">
                    <TabBar<SettingTab>
                        tabs={SETTINGS_TABS}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        theme={theme as 'light' | 'dark'}
                        underlineLayoutId="settings-tab-underline"
                        className="justify-center flex-wrap gap-x-5 sm:gap-x-8"
                    />
                </div>
                <main>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`backdrop-blur-2xl rounded-[3rem] border overflow-hidden transition-colors duration-700 ${
                            isDark 
                                ? "bg-[#120533]/40 border-white/5" 
                                : "bg-white/70 border-white/50"
                        }`}
                        style={{ 
                            boxShadow: isDark 
                                ? '0 40px 100px -20px rgba(0,0,0,0.5)' 
                                : '0 40px 100px -20px rgba(0,0,0,0.03)' 
                        }}
                    >
                        {/* Consistent Header Strip */}
                        <div
                    className="px-12 py-6 flex items-center justify-between"
                    style={{ 
                        background: isDark 
                            ? 'linear-gradient(to right, #4C1D95, #1E1B4B)' 
                            : 'linear-gradient(to right, #803BED, #D946EF)',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                    }}
                >
                    <h2 className="text-white font-black uppercase tracking-[0.3em] text-[10px] opacity-90">
                        Configuration / {SETTINGS_TABS.find((t) => t.id === activeTab)?.label}
                    </h2>
                    
                    <div className="relative">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                            isDark ? "bg-[#FFCC00]" : "bg-white/40"
                        }`} />
                        {isDark && (
                            <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#FFCC00] blur-xs opacity-60" />
                        )}
                    </div>
                </div>

                        <div className="p-12 md:p-20">
                            {renderActiveTab()}
                        </div>
                    </motion.div>
                </main>
            </div>
            
            <AddCardModal 
                isOpen={isAddCardModalOpen}
                onClose={() => setIsAddCardModalOpen(false)}
                onSuccess={handleAddCardSuccess}
                paymentMethods={paymentMethods}
            />
        </div>
    );
}


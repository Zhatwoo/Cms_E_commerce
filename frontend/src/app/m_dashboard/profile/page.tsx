// Hindi to accessible sa sidebar, sa header lang sya 

'use client';
import React, { useState, useRef, useEffect } from 'react';
import { updateProfile, uploadAvatarApi } from '@/lib/api';
import { getSubscriptionPlanDisplayName } from '@/lib/subscriptionLimits';
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
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser } = useAuth();
  const { colors, theme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Felix");
  const [savedAvatarUrl, setSavedAvatarUrl] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Felix");
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    website: '',
    bio: ''
  });
  const [savedFormData, setSavedFormData] = useState({
    name: '',
    email: '',
    username: '',
    website: '',
    bio: ''
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const mergeUserWithCurrent = (incomingUser: NonNullable<typeof user>) => {
    const current = user || ({} as NonNullable<typeof user>);
    return {
      ...current,
      ...incomingUser,
      name: typeof incomingUser?.name === 'string' ? incomingUser.name : current.name,
      email: typeof incomingUser?.email === 'string' ? incomingUser.email : current.email,
      username:
        typeof incomingUser?.username === 'string' && incomingUser.username.trim() !== ''
          ? incomingUser.username
          : (current.username || ''),
      website: typeof incomingUser?.website === 'string' ? incomingUser.website : (current.website || ''),
      bio: typeof incomingUser?.bio === 'string' ? incomingUser.bio : (current.bio || ''),
      avatar: typeof incomingUser?.avatar === 'string' ? incomingUser.avatar : current.avatar,
    };
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  useEffect(() => {
    if (!cameraOpen) return;

    let cancelled = false;

    const startCamera = async () => {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError('Camera is not supported on this browser/device.');
        setCameraLoading(false);
        return;
      }

      setCameraError(null);
      setCameraLoading(true);
      stopCameraStream();

      try {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch (error) {
        if (cancelled) return;
        const err = error as { name?: string };
        let message = 'Unable to access camera. Please allow camera permission.';
        if (err?.name === 'NotAllowedError') message = 'Camera permission denied. Please allow access in your browser settings.';
        if (err?.name === 'NotFoundError') message = 'No camera device found on this machine.';
        if (err?.name === 'NotReadableError') message = 'Camera is currently being used by another app.';
        if (err?.name === 'SecurityError') message = 'Camera requires a secure context (https or localhost).';
        setCameraError(message);
      } finally {
        if (!cancelled) setCameraLoading(false);
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopCameraStream();
      setCameraLoading(false);
    };
  }, [cameraOpen]);

  useEffect(() => {
    if (user) {
      // Use avatar from backend if available, otherwise fallback to dicebear
      const nextAvatar = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
      setAvatarUrl(nextAvatar);
      setSavedAvatarUrl(nextAvatar);

      const nextFormData = {
        name: typeof user.name === 'string' ? user.name : '',
        email: typeof user.email === 'string' ? user.email : '',
        username: typeof user.username === 'string' ? user.username : '',
        website: typeof user.website === 'string' ? user.website : '',
        bio: typeof user.bio === 'string' ? user.bio : '',
      };

      setSavedFormData(nextFormData);
      setFormData((prev) => ({
        name: typeof user.name === 'string' ? user.name : prev.name,
        email: typeof user.email === 'string' ? user.email : prev.email,
        username: typeof user.username === 'string' ? user.username : prev.username,
        website: typeof user.website === 'string' ? user.website : prev.website,
        bio: typeof user.bio === 'string' ? user.bio : prev.bio,
      }));
    }
  }, [user]);

  const profileDisplayName =
    (formData.username || user?.username || '').replace(/^@+/, '') ||
    'User';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStartEdit = () => {
    setSavedFormData(formData);
    setSavedAvatarUrl(avatarUrl);
    setFeedback(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormData(savedFormData);
    setAvatarUrl(savedAvatarUrl);
    setFeedback(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!isEditing) return;
    setIsLoading(true);

    try {
      // Send only Storage URL (never base64) so Firestore stores path/URL, not image data
      const avatarToSave =
        avatarUrl?.startsWith('http') || avatarUrl?.startsWith('https')
          ? avatarUrl
          : undefined;
      const profilePayload = {
        name: formData.name,
        username: formData.username,
        website: formData.website,
        bio: formData.bio,
        ...(avatarToSave !== undefined && { avatar: avatarToSave })
      } as Parameters<typeof updateProfile>[0];

      const res = await updateProfile(profilePayload);

      if (res.success && res.user) {
        const mergedUser = mergeUserWithCurrent(res.user);
        const nextFormData = {
          name: typeof mergedUser?.name === 'string' ? mergedUser.name : formData.name,
          email: typeof mergedUser?.email === 'string' ? mergedUser.email : formData.email,
          username: typeof mergedUser?.username === 'string' ? mergedUser.username : formData.username,
          website: typeof mergedUser?.website === 'string' ? mergedUser.website : formData.website,
          bio: typeof mergedUser?.bio === 'string' ? mergedUser.bio : formData.bio,
        };
        setFormData((prev) => ({
          name: typeof mergedUser?.name === 'string' ? mergedUser.name : prev.name,
          email: typeof mergedUser?.email === 'string' ? mergedUser.email : prev.email,
          username: typeof mergedUser?.username === 'string' ? mergedUser.username : prev.username,
          website: typeof mergedUser?.website === 'string' ? mergedUser.website : prev.website,
          bio: typeof mergedUser?.bio === 'string' ? mergedUser.bio : prev.bio,
        }));
        setSavedFormData(nextFormData);
        setSavedAvatarUrl(avatarUrl);
        setIsEditing(false);
        setUser(mergedUser);
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

  const uploadAvatarFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Please choose an image file.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    setAvatarUploading(true);
    setFeedback(null);
    try {
      const res = await uploadAvatarApi(file);
      if (res.success && res.url) {
        setAvatarUrl(res.url);
        if (res.user) {
          const mergedUser = mergeUserWithCurrent(res.user);
          setUser(mergedUser);
        }
        setFeedback({ type: 'success', message: 'Avatar uploaded. Profile updated.' });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Upload failed' });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setFeedback({ type: 'error', message: msg });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadAvatarFile(file);
  };

  const openCamera = () => {
    setCameraOpen(true);
    setCameraError(null);
    setFeedback(null);
  };

  const closeCamera = () => {
    setCameraOpen(false);
    stopCameraStream();
  };

  const captureFromCamera = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (!video.videoWidth || !video.videoHeight) {
      setCameraError('Camera preview is not ready yet. Please wait a moment.');
      return;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    if (!context) {
      setFeedback({ type: 'error', message: 'Failed to process camera image.' });
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    context.drawImage(video, 0, 0, width, height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setFeedback({ type: 'error', message: 'Failed to capture image.' });
        setTimeout(() => setFeedback(null), 4000);
        return;
      }

      closeCamera();
      const capturedFile = new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
      await uploadAvatarFile(capturedFile);
    }, 'image/jpeg', 0.92);
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-8 border-b"
                  style={{ borderColor: colors.border.faint }}
                >
                  <div className="relative shrink-0">
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

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      capture="user"
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-semibold" style={{ color: colors.text.primary }}>{profileDisplayName}</h3>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>{formData.email || user?.email || 'Loading...'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"
                        style={{
                          backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(22, 163, 74, 0.1)',
                          color: colors.status.good,
                          borderColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(22, 163, 74, 0.2)'
                        }}
                      >
                        {user?.subscriptionPlan
                          ? `${getSubscriptionPlanDisplayName(user.subscriptionPlan)}${user.subscriptionPlan.toLowerCase() !== 'free' ? ' Plan' : ''}`
                          : 'Free'}
                      </span>
                      <span className="text-xs" style={{ color: colors.text.subtle }}>
                        Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '—'}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading || !isEditing}
                        title="Upload image"
                        className="px-3 py-2 rounded-lg border shadow-lg disabled:opacity-70 inline-flex items-center gap-2 text-xs font-semibold"
                        style={{
                          backgroundColor: colors.bg.elevated,
                          borderColor: colors.border.default,
                          color: colors.text.secondary
                        }}
                      >
                        {avatarUploading ? (
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block" />
                        ) : (
                          <CameraIcon />
                        )}
                        Upload Image
                      </button>

                      <button
                        type="button"
                        onClick={openCamera}
                        disabled={avatarUploading || !isEditing}
                        title="Take picture"
                        className="px-3 py-2 rounded-lg border shadow-lg disabled:opacity-70 inline-flex items-center gap-2 text-xs font-semibold"
                        style={{
                          backgroundColor: colors.bg.elevated,
                          borderColor: colors.border.default,
                          color: colors.text.secondary
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <rect x="3" y="7" width="15" height="13" rx="2" />
                          <path d="M18 10l3-2v8l-3-2" />
                        </svg>
                        Take Picture
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.subtle }}>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Your full name"
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
                      disabled
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
                        disabled={!isEditing}
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
                      disabled={!isEditing}
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
                      disabled={!isEditing}
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
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
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
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-violet-900/20"
                    >
                      Edit Profile
                    </button>
                  )}
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

      {cameraOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
          onClick={closeCamera}
        >
          <div
            className="w-full max-w-xl rounded-2xl border p-4 sm:p-5"
            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-semibold" style={{ color: colors.text.primary }}>Take profile picture</h3>
              <button type="button" onClick={closeCamera} style={{ color: colors.text.muted }} className="text-sm">Close</button>
            </div>

            <div className="rounded-xl overflow-hidden border" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.dark }}>
              <div className="relative h-[320px]">
                <video
                  ref={videoRef}
                  className="w-full h-[320px] object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                {cameraLoading && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
                    <span className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: '#fff' }} />
                  </div>
                )}
              </div>
            </div>

            {cameraError && (
              <p className="mt-3 text-sm" style={{ color: colors.status.error }}>
                {cameraError}
              </p>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeCamera}
                className="px-4 py-2 rounded-lg text-sm font-medium border"
                style={{ borderColor: colors.border.faint, color: colors.text.secondary }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={captureFromCamera}
                disabled={cameraLoading || avatarUploading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-60"
              >
                Capture & Use
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
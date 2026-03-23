"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserAccountShell } from "../page";
import { UserAccountSidebar } from "../components/ua_sidebar";
import { getStoredUser, setStoredUser, updateProfile, uploadAvatarApi, type User } from "@/lib/api";

export default function ProfilePage() {

	const storedUser = getStoredUser();
	const [profile, setProfile] = useState({
		displayName: storedUser?.name || "John Lloyd Gatal",
		email: storedUser?.email || "redemptrixlloyd906@gmail.com",
		username: (storedUser as any)?.username || "kurohara",
		website: (storedUser as any)?.website || "https://www.facebook.com/gataljohnlloyd",
		bio: storedUser?.bio || "Building the future of commerce. Love React, Three.js, and good coffee.",
		membership: "Free",
		joinedDate: "2026",
		avatar: storedUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=b6e3f4",
	});

	const [isEditing, setIsEditing] = useState(false);
	const [savedProfile, setSavedProfile] = useState(profile);
	const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
	const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	// Sync with stored user on mount or when storedUser changes
	useEffect(() => {
		if (storedUser) {
			const u = {
				displayName: storedUser.name,
				email: storedUser.email,
				username: (storedUser as any).username || "kurohara",
				website: (storedUser as any).website || "",
				bio: storedUser.bio || "",
				membership: "Free",
				joinedDate: "2026",
				avatar: storedUser.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=b6e3f4",
			};
			setProfile(u);
			setSavedProfile(u);
		}
	}, []);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const cameraInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setProfile(prev => ({ ...prev, avatar: reader.result as string }));
			};
			reader.readAsDataURL(file);
		}
	};

	const hasProfileChanges = useMemo(
		() => JSON.stringify(profile) !== JSON.stringify(savedProfile),
		[profile, savedProfile]
	);

	const charLimit = 250;
	const charsLeft = charLimit - profile.bio.length;

	return (
		<UserAccountShell activePath="Profile">
			<div className="grid grid-cols-12 gap-6">
				<div className="col-span-12 lg:col-span-3">
					<UserAccountSidebar />
				</div>

				<div className="col-span-12 lg:col-span-9">
					<motion.div
						initial={{ opacity: 0, y: 14 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.45 }}
						className="rounded-[32px] border border-[#E5E7EB] bg-white p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
					>
						{/* Header Section */}
						<div className="mb-10 flex items-center justify-between gap-6">
							<div className="flex items-center gap-6">
								<div className="relative group/avatar">
									<div className="h-24 w-24 overflow-hidden rounded-full border-4 border-[#F3E8FF] bg-[#F5F4FF] shadow-sm transition-transform duration-300 group-hover/avatar:scale-[1.02]">
										<img
											src={profile.avatar}
											alt="Profile"
											className="h-full w-full object-cover"
										/>
									</div>

									<input
										type="file"
										ref={fileInputRef}
										className="hidden"
										accept="image/*"
										onChange={handleFileChange}
									/>
									<input
										type="file"
										ref={cameraInputRef}
										className="hidden"
										accept="image/*"
										capture="user"
										onChange={handleFileChange}
									/>
									
									{/* Avatar Actions Overlay (Visible only when Editing) */}
									<AnimatePresence>
										{isEditing && (
											<motion.div
												initial={{ opacity: 0, y: 8 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, scale: 0.95 }}
												className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2"
											>
												<button
													type="button"
													onClick={() => cameraInputRef.current?.click()}
													className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#4a1a8a] shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-[rgba(166,61,255,0.1)] transition-all hover:bg-[#F5F4FF] hover:scale-110 active:scale-90"
													title="Take Camera"
												>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
													</svg>
												</button>
												<button
													type="button"
													onClick={() => fileInputRef.current?.click()}
													className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#4a1a8a] shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-[rgba(166,61,255,0.1)] transition-all hover:bg-[#F5F4FF] hover:scale-110 active:scale-90"
													title="Upload Photo"
												>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
													</svg>
												</button>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
								<div>
									<h2 className="text-2xl font-bold text-[#4a1a8a]">{profile.displayName}</h2>
									<p className="font-medium text-[#7a6aa0]">@{profile.username}</p>
								</div>
							</div>

							{!isEditing && (
								<button
									onClick={() => setIsEditing(true)}
									className="flex items-center gap-2 rounded-xl border border-[rgba(166,61,255,0.22)] bg-white px-4 py-2 text-sm font-semibold text-[#4a1a8a] shadow-sm transition-all hover:bg-[#F5F4FF] active:scale-95"
								>
									<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
									</svg>
									Edit Profile
								</button>
							)}
						</div>

						{/* Form Grid */}
						<div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
							<div className="space-y-2">
								<label className="text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase">FULL NAME</label>
								<input
									type="text"
									readOnly={!isEditing}
									value={profile.displayName}
									onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
									className={`w-full rounded-xl border-none px-4 py-3 text-sm font-medium outline-none transition-all ${isEditing
										? "bg-[#F9FAFB] text-[#374151] focus:ring-2 focus:ring-[#4a1a8a]/20"
										: "bg-transparent text-[#7a6aa0] cursor-default"
										}`}
								/>
							</div>
							<div className="space-y-2">
								<label className="text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase">EMAIL</label>
								<input
									type="email"
									readOnly={!isEditing}
									value={profile.email}
									onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
									className={`w-full rounded-xl border-none px-4 py-3 text-sm font-medium outline-none transition-all ${isEditing
										? "bg-[#F9FAFB] text-[#374151] focus:ring-2 focus:ring-[#4a1a8a]/20"
										: "bg-transparent text-[#7a6aa0] cursor-default"
										}`}
								/>
							</div>
							<div className="space-y-2">
								<label className="text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase">USERNAME</label>
								<div className="relative">
									<span className={`absolute left-4 top-1/2 -translate-y-1/2 ${isEditing ? "text-[#9CA3AF]" : "text-[#D1D5DB]"}`}>@</span>
									<input
										type="text"
										readOnly={!isEditing}
										value={profile.username}
										onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
										className={`w-full rounded-xl border-none pl-8 pr-4 py-3 text-sm font-medium outline-none transition-all ${isEditing
											? "bg-[#F9FAFB] text-[#374151] focus:ring-2 focus:ring-[#4a1a8a]/20"
											: "bg-transparent text-[#7a6aa0] cursor-default"
											}`}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<label className="text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase">WEBSITE</label>
								<input
									type="text"
									readOnly={!isEditing}
									value={profile.website}
									onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
									className={`w-full rounded-xl border-none px-4 py-3 text-sm font-medium outline-none transition-all ${isEditing
										? "bg-[#F9FAFB] text-[#374151] focus:ring-2 focus:ring-[#4a1a8a]/20"
										: "bg-transparent text-[#7a6aa0] cursor-default"
										}`}
								/>
							</div>
							<div className="col-span-full space-y-2">
								<label className="text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase">BIO</label>
								<textarea
									value={profile.bio}
									readOnly={!isEditing}
									rows={4}
									onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value.slice(0, charLimit) }))}
									className={`w-full resize-none rounded-xl border-none px-4 py-3 text-sm font-medium outline-none transition-all ${isEditing
										? "bg-[#F9FAFB] text-[#374151] focus:ring-2 focus:ring-[#4a1a8a]/20"
										: "bg-transparent text-[#7a6aa0] cursor-default"
										}`}
								/>
								{isEditing && (
									<div className="text-right">
										<span className="text-xs text-[#9CA3AF]">{charsLeft} characters left</span>
									</div>
								)}
							</div>
						</div>

						{/* Actions (visible only when editing) */}
						<AnimatePresence>
							{isEditing && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 10 }}
								>
									<div className="my-8 border-t border-[#F3F4F6]" />
									<div className="flex items-center justify-end gap-6">
										<button
											type="button"
											onClick={() => {
												if (hasProfileChanges) {
													setShowCancelConfirmation(true);
												} else {
													setIsEditing(false);
												}
											}}
											className="text-sm font-semibold text-[#8A86A4] hover:text-[#4a1a8a] transition-colors"
										>
											Cancel
										</button>
										<button
											type="button"
											onClick={() => setShowSaveConfirmation(true)}
											disabled={!hasProfileChanges}
											className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold shadow-sm transition-all ${hasProfileChanges
												? "bg-[#4a1a8a] text-white hover:opacity-90 active:scale-95"
												: "bg-gray-100 text-gray-400 cursor-not-allowed"
												}`}
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
											</svg>
											Save Changes
										</button>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				</div>
			</div>

			<AnimatePresence>
				{showSaveConfirmation && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(200,185,245,0.35)] px-4 backdrop-blur-[4px]"
					>
						<motion.div initial={{ y: 12, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 8, opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="w-full max-w-md rounded-[24px] bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
							<h3 className="text-xl font-bold text-[#4a1a8a]">Confirm changes</h3>
							<p className="mt-2 text-[#7a6aa0]">Are you sure you want to update your profile information?</p>
							<div className="mt-8 flex items-center justify-end gap-4">
								<button type="button" onClick={() => setShowSaveConfirmation(false)} className="px-4 py-2 text-sm font-semibold text-[#7a6aa0] hover:text-[#4a1a8a]">Cancel</button>
								<button
									type="button"
									onClick={async () => {
										try {
											let finalAvatarUrl = profile.avatar;

											// If there's a new file, upload it first to get a Storage URL
											if (selectedFile) {
												const uploadRes = await uploadAvatarApi(selectedFile);
												if (uploadRes.success && uploadRes.url) {
													finalAvatarUrl = uploadRes.url;
												} else {
													throw new Error(uploadRes.message || "Failed to upload image");
												}
											}

											// Official API update to the backend with a real storage URL
											const res = await updateProfile({
												name: profile.displayName,
												username: profile.username,
												avatar: finalAvatarUrl,
												website: profile.website,
												bio: profile.bio
											});
											
											if (res.success && res.user) {
												setProfile(prev => ({ ...prev, avatar: res.user!.avatar || prev.avatar }));
												setSavedProfile({ ...profile, avatar: res.user.avatar || finalAvatarUrl });
												setStoredUser(res.user);
												setSelectedFile(null); // Clear selected file after success
												// Notify header and others
												window.dispatchEvent(new Event('userUpdate'));
											}
										} catch (error) {
											console.error("Failed to update profile", error);
											// fallback to session storage if backend fails
											setSavedProfile(profile);
											setStoredUser({
												...storedUser!,
												name: profile.displayName,
												username: profile.username,
												avatar: profile.avatar,
												website: profile.website,
												bio: profile.bio
											} as any);
											window.dispatchEvent(new Event('userUpdate'));
										}

										setShowSaveConfirmation(false);
										setIsEditing(false);
									}}
									className="rounded-xl bg-[#4a1a8a] px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
								>
									Confirm
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}

				{showCancelConfirmation && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(200,185,245,0.35)] px-4 backdrop-blur-[4px]">
						<motion.div initial={{ y: 12, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 8, opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="w-full max-w-md rounded-[24px] bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
							<h3 className="text-xl font-bold text-[#4a1a8a]">Discard changes</h3>
							<p className="mt-2 text-[#7a6aa0]">You have unsaved changes. Are you sure you want to cancel editing?</p>
							<div className="mt-8 flex items-center justify-end gap-4">
								<button type="button" onClick={() => setShowCancelConfirmation(false)} className="px-4 py-2 text-sm font-semibold text-[#7a6aa0] hover:text-[#4a1a8a]">Wait, no</button>
								<button
									type="button"
									onClick={() => {
										setProfile(savedProfile);
										setShowCancelConfirmation(false);
										setIsEditing(false);
									}}
									className="rounded-xl bg-red-50 px-6 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
								>
									Yes, discard
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</UserAccountShell>
	);
}

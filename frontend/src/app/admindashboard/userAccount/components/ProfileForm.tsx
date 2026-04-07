"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export interface ProfileData {
  displayName: string;
  email: string;
  username: string;
  website: string;
  bio: string;
  avatar: string;
  membership: string;
  joinedDate: string;
}

interface ProfileFormProps {
  initialData: ProfileData;
  onSave: (data: ProfileData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export function ProfileForm({ initialData, onSave, onCancel, isSaving }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof ProfileData, string>> = {};
    if (!formData.displayName.trim()) newErrors.displayName = "Full name is required";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      await onSave(formData);
    }
  };

  const charLimit = 250;
  const charsLeft = charLimit - (formData.bio?.length || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[10px] font-bold tracking-[0.15em] text-[#9CA3AF] uppercase mb-1 block">FULL NAME</label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
            className={`w-full rounded-[14px] border-2 px-4 py-3.5 text-sm font-semibold outline-none transition-all duration-300 bg-[#F9FAFB]/50 text-[#374151] hover:bg-[#F9FAFB] ${errors.displayName ? "border-red-200 focus:ring-4 focus:ring-red-100" : "border-transparent focus:border-[#4a1a8a]/20 focus:ring-4 focus:ring-[#4a1a8a]/5"}`}
            placeholder="Your full name"
          />
          {errors.displayName && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-1">{errors.displayName}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold tracking-[0.15em] text-[#9CA3AF] uppercase mb-1 block">EMAIL</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className={`w-full rounded-[14px] border-2 px-4 py-3.5 text-sm font-semibold outline-none transition-all duration-300 bg-[#F9FAFB]/50 text-[#374151] hover:bg-[#F9FAFB] ${errors.email ? "border-red-200 focus:ring-4 focus:ring-red-100" : "border-transparent focus:border-[#4a1a8a]/20 focus:ring-4 focus:ring-[#4a1a8a]/5"}`}
            placeholder="your@email.com"
          />
          {errors.email && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-1">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold tracking-[0.15em] text-[#9CA3AF] uppercase mb-1 block">USERNAME</label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] font-bold transition-colors group-focus-within:text-[#4a1a8a]">@</span>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className={`w-full rounded-[14px] border-2 pl-9 pr-4 py-3.5 text-sm font-semibold outline-none transition-all duration-300 bg-[#F9FAFB]/50 text-[#374151] hover:bg-[#F9FAFB] ${errors.username ? "border-red-200 focus:ring-4 focus:ring-red-100" : "border-transparent focus:border-[#4a1a8a]/20 focus:ring-4 focus:ring-[#4a1a8a]/5"}`}
              placeholder="username"
            />
          </div>
          {errors.username && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-1">{errors.username}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold tracking-[0.15em] text-[#9CA3AF] uppercase mb-1 block">WEBSITE</label>
          <input
            type="text"
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            className="w-full rounded-[14px] border-2 border-transparent px-4 py-3.5 text-sm font-semibold outline-none transition-all duration-300 bg-[#F9FAFB]/50 text-[#374151] hover:bg-[#F9FAFB] focus:border-[#4a1a8a]/20 focus:ring-4 focus:ring-[#4a1a8a]/5"
            placeholder="https://yourwebsite.com"
          />
        </div>

        <div className="col-span-full space-y-2">
          <label className="text-[10px] font-bold tracking-[0.15em] text-[#9CA3AF] uppercase mb-1 block">BIO</label>
          <textarea
            value={formData.bio}
            rows={4}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value.slice(0, charLimit) }))}
            className="w-full resize-none rounded-[14px] border-2 border-transparent px-4 py-3.5 text-sm font-semibold outline-none transition-all duration-300 bg-[#F9FAFB]/50 text-[#374151] hover:bg-[#F9FAFB] focus:border-[#4a1a8a]/20 focus:ring-4 focus:ring-[#4a1a8a]/5"
            placeholder="Write a short bio about yourself..."
          />
          <div className="text-right px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">{charsLeft} characters remaining</span>
          </div>
        </div>
      </div>

      <div className="my-10 h-px w-full bg-gradient-to-r from-transparent via-[#F3F4F6] to-transparent" />

      <div className="flex items-center justify-end gap-8">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="text-xs font-black uppercase tracking-[0.15em] text-[#8A86A4] hover:text-[#4a1a8a] transition-all active:scale-95 disabled:opacity-50"
        >
          Discard Changes
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-3 rounded-[16px] bg-[#4a1a8a] px-8 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-[#4a1a8a]/20 transition-all hover:shadow-[#4a1a8a]/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:scale-100"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Profile
            </>
          )}
        </button>
      </div>
    </form>
  );
}

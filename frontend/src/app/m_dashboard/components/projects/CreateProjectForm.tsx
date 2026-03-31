"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createProject,
  getStoredUser,
  listProjects,
  type Project,
} from "@/lib/api";
import { ensureProjectStorageFolder } from "@/lib/firebaseStorage";
import { INDUSTRY_OPTIONS } from "@/lib/industryCatalog";
import { getLimits } from "@/lib/subscriptionLimits";
import { useTheme } from "@/app/m_dashboard/components/context/theme-context";

type CreateProjectFormProps = {
  /** Path used by the cancel action to return to the previous screen. */
  cancelHref?: string;
  /** Optional callback fired with the created project before redirecting to design. */
  onCreated?: (project: Project) => void;
};

/**
 * Normalizes subdomain input to lowercase alphanumeric and hyphens only.
 *
 * @param value Raw subdomain value from user input.
 * @returns Sanitized subdomain suitable for API payloads.
 */
function sanitizeSubdomain(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}

/**
 * Project creation form used by the dedicated "new project" page.
 * Handles plan-limit checks, project creation, and redirect to the design editor.
 */
export function CreateProjectForm({
  cancelHref = "/m_dashboard/projects",
  onCreated,
}: CreateProjectFormProps) {
  const router = useRouter();
  const { theme } = useTheme();

  const [title, setTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  /**
   * Submits the create-project form.
   *
   * @param event Form submission event from React.
   */
  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError("");

      const trimmedTitle = title.trim() || "Untitled Project";
      const trimmedIndustry = industry.trim();
      const trimmedSubdomain = sanitizeSubdomain(subdomain);

      if (!trimmedIndustry) {
        setError("Please select your store industry.");
        return;
      }

      try {
        setCreating(true);

        const user = getStoredUser();
        const plan = user?.subscriptionPlan || "free";
        const limits = getLimits(plan);
        const projectListRes = await listProjects();
        const activeProjects = projectListRes.success && projectListRes.projects ? projectListRes.projects : [];

        if (activeProjects.length >= limits.projects) {
          setError(`Your ${plan} plan allows up to ${limits.projects} projects. Upgrade to unlock more.`);
          return;
        }

        const response = await createProject({
          title: trimmedTitle,
          industry: trimmedIndustry,
          subdomain: trimmedSubdomain || undefined,
          templateId: null,
        });

        if (!response.success || !response.project) {
          setError(response.message || "Failed to create project. Please try again.");
          return;
        }

        onCreated?.(response.project);

        const clientName = (user?.name || user?.username || "client").trim() || "client";
        ensureProjectStorageFolder(clientName, response.project.title || "website").catch(() => {});
        router.push(`/design?projectId=${response.project.id}`);
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : "";
        setError(
          message.includes("fetch")
            ? "Cannot reach server. Make sure the backend is running."
            : "Failed to create project. Please try again."
        );
      } finally {
        setCreating(false);
      }
    },
    [industry, onCreated, router, subdomain, title]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-3xl mx-auto py-12 transition-all duration-500 [font-family:var(--font-outfit),sans-serif]"
    >
      <div className="mb-12 text-center">
        <h2 className="text-4xl sm:text-6xl lg:text-[76px] font-black leading-tight tracking-tight [font-family:var(--font-outfit),sans-serif]">
          <span className={`block ${theme === "dark" ? "text-white" : "text-[#120533]"}`}>
            Create new{" "}
            <span
              style={{
                backgroundImage:
                  theme === "dark"
                    ? "linear-gradient(90deg, #7c3aed 0%, #d946ef 50%, #ffcc00 100%)"
                    : "linear-gradient(90deg, #7c3aed 0%, #d946ef 50%, #f5a213 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
                display: "inline-block",
              }}
            >
              Project
            </span>
          </span>
        </h2>
        <p className={`text-base sm:text-lg mt-2 ${theme === "dark" ? "text-[#8A8FC4]" : "text-[#120533]/70"}`}>
          Give your project a name and an optional subdomain.
        </p>
      </div>

      <div className="space-y-12">
        {/* Project Title: The High-Gloss Plate */}
        <div className="group">
          <label className={`block text-[10px] font-black uppercase tracking-[0.4em] mb-4 ml-4 opacity-50
            ${theme === "dark" ? "text-[#C4C6E8]" : "text-[#120533]"}`}>
            Project Name
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name your masterpiece..."
            className={`w-full px-8 py-5 rounded-2xl text-2xl font-black tracking-tight outline-none transition-all duration-500
              ${theme === "dark"
                ? "bg-white/5 border border-white/10 text-white focus:bg-white/10 focus:border-[#FFCE00]/50 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                : "bg-slate-50 border border-slate-100 text-slate-900 focus:bg-white focus:border-[#8B5CF6]/30 shadow-[0_15px_35px_rgba(0,0,0,0.02)] focus:shadow-[0_20px_50px_rgba(139,92,246,0.15)]"
              }`}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-10">
          {/* Industry Field */}
          <div className="group">
            <label className={`block text-[10px] font-black uppercase tracking-[0.4em] mb-4 ml-4 opacity-50
              ${theme === "dark" ? "text-[#C4C6E8]" : "text-[#120533]"}`}>
              Industry
            </label>
            <div className="relative">
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={`w-full px-8 py-5 rounded-xl text-sm font-bold outline-none appearance-none cursor-pointer transition-all duration-500
                  ${theme === "dark"
                    ? "bg-white/5 border border-white/10 text-white focus:border-[#6B72D8]"
                    : "bg-slate-50 border border-slate-100 text-slate-900 focus:bg-white focus:border-[#8B5CF6]"
                  }`}
              >
                <option value="" disabled>Select category</option>
                {INDUSTRY_OPTIONS.map((item) => (
                  <option key={item.key} value={item.key} className="text-black">{item.label}</option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          {/* Subdomain Field */}
          <div className="group">
            <label className={`block text-[10px] font-black uppercase tracking-[0.4em] mb-4 ml-4 opacity-50
              ${theme === "dark" ? "text-[#C4C6E8]" : "text-[#120533]"}`}>
              Subdomain
            </label>
            <input
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              placeholder="mystore"
              className={`w-full px-8 py-5 rounded-xl text-sm font-bold outline-none transition-all duration-500
                ${theme === "dark"
                  ? "bg-white/5 border border-white/10 text-white focus:border-[#6B72D8]"
                  : "bg-slate-50 border border-slate-100 text-slate-900 focus:bg-white focus:border-[#8B5CF6]"
                }`}
            />
          </div>
        </div>
      </div>

      {/* THE ACTION: High-Saturation Lavender Glow */}
      <div className="mt-28 flex flex-col items-center">
        <button
          type="submit"
          disabled={creating}
          className={`
            cursor-pointer relative px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-[0.4em] transition-all duration-500
            active:scale-95 disabled:opacity-50
            text-white shadow-[0_8px_24px_rgba(217,70,239,0.4)] hover:shadow-[0_12px_28px_rgba(217,70,239,0.5)] hover:brightness-110 hover:-translate-y-1
          `}
          style={{ background: "linear-gradient(90deg, #9333ea 0%, #ec4899 100%)" }}
        >
          {creating ? "Creating..." : "Create Website"}
        </button>

        <button
          type="button"
          onClick={() => router.push(cancelHref)}
          className={`cursor-pointer mt-10 text-[9px] font-black uppercase tracking-[0.8em] transition-all opacity-20 hover:opacity-100
            ${theme === "dark" ? "text-white" : "text-[#120533]"}`}
        >
          Back to Dashboard
        </button>
      </div>
    </form>
  );
}

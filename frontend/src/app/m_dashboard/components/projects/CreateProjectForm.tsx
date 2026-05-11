"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createProject,
  type Project,
} from "@/lib/api";
import { INDUSTRY_OPTIONS } from "@/lib/industryCatalog";
import { useTheme } from "@/app/m_dashboard/components/context/theme-context";
import { CustomDropdown } from "@/app/m_dashboard/components/ui/customDropdown";

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

  const industryDropdownOptions = INDUSTRY_OPTIONS.map((item) => ({
    id: item.key,
    label: item.label,
  }));

  const fieldInputStyles = `
    w-full h-[52px] rounded-2xl px-6 border outline-none transition-all duration-500
    text-sm font-medium tracking-tight shadow-[0_0_12px_rgba(31,31,81,0.08)]
  `;

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
          Give your project a name and a subdomain.
        </p>
      </div>

      <div className="space-y-12">
        {/* Project Title: The High-Gloss Plate */}
        <div className="group">
          <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 opacity-50 group-focus-within:opacity-100 transition-opacity
            ${theme === "dark" ? "text-[#C4C6E8]" : "text-[#120533]"}`}>
            Project Name
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name your masterpiece..."
            className={`${fieldInputStyles} ${theme === "dark"
              ? "bg-[#141446] border-[#1F1F51] text-white shadow-[0_0_12px_rgba(31,31,81,0.4)] hover:border-[#2a2a6e] focus:border-[#3b3b8a]"
              : "bg-white border-slate-100 text-[#120533] shadow-[0_0_15px_rgba(139,92,246,0.1)] hover:border-[#8B5CF6]/40 focus:border-[#8B5CF6]"
            }`}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-10">
          {/* Industry Field */}
          <div className="group">
            <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 opacity-50 group-focus-within:opacity-100 transition-opacity
              ${theme === "dark" ? "text-[#C4C6E8]" : "text-[#120533]"}`}>
              Industry
            </label>
            <CustomDropdown
              value={industry}
              onChange={setIndustry}
              options={industryDropdownOptions}
              title="Industry"
              className="md:w-full"
            />
          </div>

          {/* Subdomain Field */}
          <div className="group">
            <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 opacity-50 group-focus-within:opacity-100 transition-opacity
              ${theme === "dark" ? "text-[#C4C6E8]" : "text-[#120533]"}`}>
              Subdomain
            </label>
            <input
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              placeholder="mystore"
              className={`${fieldInputStyles} ${theme === "dark"
                ? "bg-[#141446] border-[#1F1F51] text-white shadow-[0_0_12px_rgba(31,31,81,0.4)] hover:border-[#2a2a6e] focus:border-[#3b3b8a]"
                : "bg-white border-slate-100 text-[#120533] shadow-[0_0_15px_rgba(139,92,246,0.1)] hover:border-[#8B5CF6]/40 focus:border-[#8B5CF6]"
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
            ${theme === "dark" ? "text-[#120533] shadow-[0_8px_24px_rgba(255,206,0,0.42)] hover:shadow-[0_12px_28px_rgba(255,206,0,0.55)]" : "text-white shadow-[0_8px_24px_rgba(217,70,239,0.4)] hover:shadow-[0_12px_28px_rgba(217,70,239,0.5)]"}
            hover:brightness-110 hover:-translate-y-1
          `}
          style={{ background: theme === "dark" ? "#FFCE00" : "linear-gradient(90deg, #9333ea 0%, #ec4899 100%)" }}
        >
          {creating ? "Creating..." : "Create Website"}
        </button>

        <button
          type="button"
          onClick={() => router.push(cancelHref)}
          className={`cursor-pointer mt-10 inline-flex items-center justify-center rounded-full border px-6 py-3 text-[10px] font-black uppercase tracking-[0.35em] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg
            ${theme === "dark"
              ? "border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/25"
              : "border-slate-200 bg-white text-[#120533] hover:bg-slate-50 hover:border-[#8B5CF6]/30 hover:text-[#8B5CF6]"
            }`}
        >
          Back to Dashboard
        </button>
      </div>
    </form>
  );
}

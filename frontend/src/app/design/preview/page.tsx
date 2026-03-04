"use client";

import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { ArrowLeft, Copy, Check, Download, Layers, Braces, Save, Globe, Upload, Monitor, Tablet, Smartphone } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { deserializeCleanToCraft } from "../_lib/serializer";
import { parseContentToCleanDoc } from "../_lib/contentParser";
import { autoSavePage, getDraft } from "../_lib/pageApi";
import { WebPreview } from "../_lib/webRenderer";
import { PREVIEW_MOBILE_BREAKPOINT } from "../_lib/viewportConstants";
import { templateService } from "@/lib/templateService";
import { useAlert } from "@/app/m_dashboard/components/context/alert-context";
import { getProject, getSchedule, getStoredUser, publishProject, schedulePublish, updateProject, getMyDomains, type Project } from "@/lib/api";
import { getSubdomainSiteUrl } from "@/lib/siteUrls";
import { getLimits } from "@/lib/subscriptionLimits";
import { uploadClientFile } from "@/lib/firebaseStorage";
import html2canvas from "html2canvas";
//vdxvx
const DEFAULT_PROJECT_ID = "Leb2oTDdXU3Jh2wdW1sI";
const STORAGE_KEY_PREFIX = "craftjs_preview_json";

type ViewMode = "Web-Preview" | "clean" | "raw";
type PreviewViewport = "desktop" | "tablet" | "mobile";



function PreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || DEFAULT_PROJECT_ID;
  const initialPageSlug = searchParams.get("page") ?? undefined;
  const { showAlert } = useAlert();
  const [rawJson, setRawJson] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("Web-Preview");
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("Landing Page");
  const [templateDescription, setTemplateDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishDomainName, setPublishDomainName] = useState("");
  const [publishDomainError, setPublishDomainError] = useState("");
  const [showPublishedSuccessModal, setShowPublishedSuccessModal] = useState(false);
  const [publishedSubdomain, setPublishedSubdomain] = useState<string | null>(null);
  const [publishMode, setPublishMode] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduleInfo, setScheduleInfo] = useState<{ scheduledAt: string; subdomain: string | null } | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [selectedPreviewPageSlug, setSelectedPreviewPageSlug] = useState<string | undefined>(initialPageSlug);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const thumbnailCaptureRef = useRef(false);

  const readSessionSnapshot = (targetProjectId: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      const perProject = window.sessionStorage.getItem(`${STORAGE_KEY_PREFIX}_${targetProjectId}`);
      if (perProject) return perProject;
      return window.sessionStorage.getItem(STORAGE_KEY_PREFIX);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const sessionSnapshot = readSessionSnapshot(projectId);
        if (sessionSnapshot) {
          console.log('✅ Preview: Loaded latest snapshot from sessionStorage');
          if (!cancelled) {
            setRawJson(sessionSnapshot);
            setLoading(false);
          }
          return;
        }

        console.log(`📡 Preview: Fetching draft for Project: ${projectId}...`);
        const timeoutMs = 12000;
        const result = await Promise.race([
          getDraft(projectId),
          new Promise<{ success: false; timeout: true }>((resolve) =>
            window.setTimeout(() => resolve({ success: false, timeout: true }), timeoutMs)
          ),
        ]);

        if (cancelled) return;

        if ((result as { timeout?: boolean }).timeout) {
          console.warn(`⚠️ Preview: getDraft timeout after ${timeoutMs}ms`);
        }

        let loaded = false;

        if (result.success && result.data) {
          console.log('✅ Preview: API result success. Keys in data:', Object.keys(result.data));

          if (result.data.content) {
            let content = result.data.content;

            // If already clean object, we still keep it as "rawJson" (as string) 
            // for the rest of the existing preview logic to work (it formats it etc.)
            if (typeof content === 'object') {
              console.log('✨ Data is CLEAN format (version:', content.version, ')');
              if (!cancelled) setRawJson(JSON.stringify(content));
            } else {
              if (!cancelled) setRawJson(content);
            }
            loaded = true;
            console.log('✅ Preview: Data loaded');
          } else {
            console.warn('⚠️ Preview: No content found in result data');
          }
        } else {
          console.warn('⚠️ Preview: API success=false or no data found');
        }

        if (!loaded) {
          const fallback = readSessionSnapshot(projectId);
          if (fallback) {
            console.log('✅ Preview: Loaded fallback snapshot from sessionStorage');
            if (!cancelled) setRawJson(fallback);
          }
        }
      } catch (error) {
        console.error('❌ Preview: Load error:', error);
        const fallback = readSessionSnapshot(projectId);
        if (fallback) {
          console.log('✅ Preview: Loaded fallback snapshot after API error');
          if (!cancelled) setRawJson(fallback);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    let active = true;
    async function loadProject() {
      try {
        const res = await getProject(projectId);
        if (active && res.success && res.project) {
          setProject(res.project);
        }
      } catch {
        // ignore
      }
    }
    loadProject();
    return () => { active = false; };
  }, [projectId]);

  // Compute clean document
  const cleanDoc = useMemo(() => {
    if (!rawJson) return null;
    return parseContentToCleanDoc(rawJson);
  }, [rawJson]);

  const cleanJson = useMemo(
    () => (cleanDoc ? JSON.stringify(cleanDoc, null, 2) : null),
    [cleanDoc]
  );

  const previewPages = useMemo(() => {
    if (!cleanDoc?.pages?.length) return [] as Array<{ slug: string; name: string }>;
    return cleanDoc.pages.map((page, index) => {
      const pageProps = (page?.props ?? {}) as Record<string, unknown>;
      const rawName = page?.name ?? pageProps.pageName;
      const name = typeof rawName === "string" && rawName.trim() ? rawName.trim() : `Page ${index + 1}`;
      const rawSlug = page?.slug ?? pageProps.pageSlug;
      const slug = typeof rawSlug === "string" && rawSlug.trim() ? rawSlug.trim() : `page-${index + 1}`;
      return { slug, name };
    });
  }, [cleanDoc]);

  useEffect(() => {
    if (previewPages.length === 0) {
      setSelectedPreviewPageSlug(undefined);
      return;
    }

    const hasSelected = selectedPreviewPageSlug
      ? previewPages.some((p) => p.slug === selectedPreviewPageSlug)
      : false;

    if (!hasSelected) {
      const initialMatch = initialPageSlug
        ? previewPages.find((p) => p.slug === initialPageSlug)
        : undefined;
      setSelectedPreviewPageSlug(initialMatch?.slug ?? previewPages[0]?.slug);
    }
  }, [previewPages, selectedPreviewPageSlug, initialPageSlug]);

  const selectedPreviewPage = useMemo(() => {
    if (previewPages.length === 0) return null;
    return previewPages.find((p) => p.slug === selectedPreviewPageSlug) ?? previewPages[0] ?? null;
  }, [previewPages, selectedPreviewPageSlug]);

  const desktopPreviewWidth = useMemo(() => {
    const selectedIndex = selectedPreviewPage
      ? previewPages.findIndex((page) => page.slug === selectedPreviewPage.slug)
      : 0;
    const targetPage = selectedIndex >= 0 ? cleanDoc?.pages?.[selectedIndex] : cleanDoc?.pages?.[0];
    const rawWidth = targetPage?.props?.width;
    if (typeof rawWidth === "number" && Number.isFinite(rawWidth) && rawWidth > 0) {
      return `${rawWidth}px`;
    }
    if (typeof rawWidth === "string" && rawWidth.trim()) {
      return rawWidth.trim();
    }
    return "1920px";
  }, [cleanDoc, previewPages, selectedPreviewPage]);

  const desktopPreviewStyle = useMemo<React.CSSProperties>(() => {
    const lower = desktopPreviewWidth.toLowerCase();
    const isFluid =
      lower.includes("%") ||
      lower.includes("vw") ||
      lower.startsWith("min(") ||
      lower.startsWith("max(") ||
      lower.startsWith("clamp(");

    if (isFluid) {
      return {
        width: desktopPreviewWidth,
      };
    }

    return {
      width: desktopPreviewWidth,
      minWidth: desktopPreviewWidth,
    };
  }, [desktopPreviewWidth]);

  const rawFormatted = useMemo(() => {
    if (!rawJson) return null;
    try {
      const parsed = JSON.parse(rawJson);

      // If the data from DB is already CLEAN (BuilderDocument),
      // we must reconstruct the RAW (Craft.js) format for this specific view.
      if (parsed.version !== undefined && parsed.pages && parsed.nodes) {
        const reconstructedRaw = deserializeCleanToCraft(parsed);
        return JSON.stringify(JSON.parse(reconstructedRaw), null, 2);
      }

      return JSON.stringify(parsed, null, 2);
    } catch {
      return rawJson;
    }
  }, [rawJson]);

  const activeJson = viewMode === "clean" ? cleanJson : viewMode === "raw" ? rawFormatted : null;
  const useBuilderParityMode = viewMode === "Web-Preview" && previewViewport === "desktop";

  const capturePreviewThumbnail = async () => {
    if (thumbnailCaptureRef.current || !previewRef.current || !projectId) return;
    if (viewMode !== "Web-Preview" || loading || !cleanDoc) return;

    thumbnailCaptureRef.current = true;
    try {
      const canvas = await html2canvas(previewRef.current, {
        background: "#ffffff",
        scale: 0.7,
        useCORS: true,
      } as any);

      const blob: Blob | null = await new Promise((resolve) => {
        canvas.toBlob((b: Blob | null) => resolve(b), "image/jpeg", 0.85);
      });

      if (!blob) throw new Error("Thumbnail capture failed");

      const file = new File([blob], `preview-${projectId}.jpg`, { type: "image/jpeg" });
      const user = getStoredUser();
      const clientName = user?.name || user?.email || "client";
      const websiteName = project?.title || "project";

      const url = await uploadClientFile(file, {
        clientName,
        websiteName,
        folder: "images",
      });

      const updated = await updateProject(projectId, { thumbnail: url });
      if (updated.success) {
        setProject(updated.project);
      }
    } catch (err) {
      console.warn("Preview thumbnail capture failed:", err);
    } finally {
      thumbnailCaptureRef.current = false;
    }
  };

  useEffect(() => {
    thumbnailCaptureRef.current = false;
  }, [projectId]);

  useEffect(() => {
    if (viewMode !== "Web-Preview" || loading || !cleanDoc) return;
    const timeout = setTimeout(() => {
      capturePreviewThumbnail();
    }, 800);
    return () => clearTimeout(timeout);
  }, [viewMode, loading, cleanDoc]);

  // ── Stats ──────────────────────────────────────────
  const rawBytes = rawJson ? new Blob([rawJson]).size : 0;
  const cleanBytes = cleanJson ? new Blob([cleanJson]).size : 0;
  const rawMinBytes = rawJson
    ? new Blob([JSON.stringify(JSON.parse(rawJson))]).size
    : 0;
  const cleanMinBytes = cleanDoc
    ? new Blob([JSON.stringify(cleanDoc)]).size
    : 0;
  const reduction = rawMinBytes
    ? Math.round((1 - cleanMinBytes / rawMinBytes) * 100)
    : 0;

  const rawNodeCount = rawJson
    ? Object.keys(JSON.parse(rawJson)).length
    : 0;
  const cleanNodeCount = cleanDoc
    ? Object.keys(cleanDoc.nodes).length
    : 0;
  const pageCount = cleanDoc ? cleanDoc.pages.length : 0;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  // ── Actions ────────────────────────────────────────
  const handleCopy = async () => {
    if (!activeJson) return;
    await navigator.clipboard.writeText(activeJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeJson) return;
    const blob = new Blob([activeJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `page-${viewMode}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !templateDescription.trim()) {
      showAlert("Please fill in all fields");
      return;
    }

    if (!rawJson) {
      showAlert("No design to save. Edit your page in the design editor first, then open Preview and save as template.");
      return;
    }

    setSaving(true);
    try {
      const template = templateService.saveTemplate(
        templateName.trim(),
        templateCategory,
        templateDescription.trim(),
        rawJson
      );

      if (template) {
        showAlert("Template saved successfully!");
        setShowSaveDialog(false);
        setTemplateName("");
        setTemplateDescription("");
        // Navigate to web-builder page
        router.push("/m_dashboard/web-builder");
      } else {
        showAlert("Failed to save template. Please try again.");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      showAlert("Error saving template. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  //cjdhv
  const handlePublishClick = async () => {
    setPublishDomainError("");
    try {
      const res = await getProject(projectId);
      const existingSubdomain = res.success && res.project?.subdomain
        ? String(res.project.subdomain).trim()
        : "";
      setPublishDomainName(existingSubdomain);
    } catch {
      setPublishDomainName("");
    }
    setShowPublishDialog(true);
    setPublishMode("now");
    setScheduleInfo(null);
    if (projectId) {
      getSchedule(projectId).then((r) => {
        if (r.success && r.data) setScheduleInfo(r.data);
      });
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setScheduledAt(tomorrow.toISOString().slice(0, 16));
  };

  const isPlanLimitError = (message: string) => {
    const lower = message.toLowerCase();
    return (
      lower.includes("limit reached") ||
      lower.includes("free plan") ||
      lower.includes("allows up to") ||
      lower.includes("upgrade your subscription")
    );
  };

  const handlePublishConfirm = async () => {
    const domain = publishDomainName.trim().toLowerCase();
    if (!domain) {
      setPublishDomainError("Domain name is required.");
      return;
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(domain)) {
      setPublishDomainError("Use only letters, numbers, and hyphens. No spaces or special characters.");
      return;
    }
    if (!projectId) {
      showAlert("No project selected.");
      return;
    }
    setPublishDomainError("");
    setPublishing(true);
    try {
      const snapshot = cleanDoc ? JSON.stringify(cleanDoc) : null;
      if (snapshot) {
        await autoSavePage(snapshot, projectId);
      }

      const res = await publishProject(projectId, domain, snapshot);
      if (res.success) {
        setShowPublishDialog(false);
        setPublishDomainName("");
        const sub = res.data?.subdomain ?? domain;
        setPublishedSubdomain(sub);
        setShowPublishedSuccessModal(true);
        showAlert(`Published! Your site is live. You can change the domain later in the dashboard.`);
      } else {
        if (res.message?.includes('Limit reached')) {
          showAlert(res.message);
        } else {
          showAlert(res.message || "Publish failed.");
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Publish failed.";
      if (isPlanLimitError(message)) {
        setPublishDomainError(message);
        showAlert(message);
      } else {
        console.error("Publish error:", error);
        showAlert(message);
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleScheduleConfirm = async () => {
    const domain = publishDomainName.trim().toLowerCase();
    if (!domain) {
      setPublishDomainError("Domain name is required.");
      return;
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(domain)) {
      setPublishDomainError("Use only letters, numbers, and hyphens.");
      return;
    }
    if (!scheduledAt) {
      setPublishDomainError("Pick a date and time.");
      return;
    }
    if (!projectId) {
      showAlert("No project selected.");
      return;
    }
    setPublishDomainError("");
    setScheduling(true);
    try {
      const snapshot = cleanDoc ? JSON.stringify(cleanDoc) : null;
      if (snapshot) {
        await autoSavePage(snapshot, projectId);
      }
      const res = await schedulePublish(projectId, new Date(scheduledAt).toISOString(), domain, snapshot);
      if (res.success) {
        setShowPublishDialog(false);
        setPublishDomainName("");
        setScheduleInfo({ scheduledAt: res.data!.scheduledAt!, subdomain: res.data?.subdomain ?? null });
        showAlert(`Scheduled! Your changes will go live on ${new Date(res.data!.scheduledAt!).toLocaleString()}.`);
      } else {
        showAlert(res.message || "Schedule failed.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Schedule failed.";
      if (isPlanLimitError(message)) {
        setPublishDomainError(message);
        showAlert(message);
      } else {
        console.error("Schedule error:", error);
        showAlert(message);
      }
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-brand-lighter font-sans">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-brand-light hover:text-brand-lighter transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Editor
            </button>
            <div className="w-px h-5 bg-white/10" />
            <h1 className="text-lg font-semibold">Preview</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 transition-colors"
            >
              <Save size={14} />
              Save Template
            </button>
            <button
              onClick={handlePublishClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-colors"
            >
              <Upload size={14} />
              Publish
            </button>
            {viewMode !== "Web-Preview" && activeJson && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-green-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  <Download size={14} />
                  Download
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={`${viewMode === "Web-Preview" ? "w-full" : "max-w-7xl mx-auto"} px-6 py-6 flex flex-col gap-6`}>
        {/* View Toggle + Stats */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center bg-[#111] rounded-lg border border-white/10 p-1">
              <button
                onClick={() => setPreviewViewport("desktop")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${previewViewport === "desktop"
                  ? "bg-white/10 text-brand-lighter"
                  : "text-zinc-500 hover:text-zinc-300"
                  }`}
              >
                <Monitor size={14} />
                Desktop
              </button>
              <button
                onClick={() => setPreviewViewport("tablet")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${previewViewport === "tablet"
                  ? "bg-white/10 text-brand-lighter"
                  : "text-zinc-500 hover:text-zinc-300"
                  }`}
              >
                <Tablet size={14} />
                Tablet
              </button>
              <button
                onClick={() => setPreviewViewport("mobile")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${previewViewport === "mobile"
                  ? "bg-white/10 text-brand-lighter"
                  : "text-zinc-500 hover:text-zinc-300"
                  }`}
              >
                <Smartphone size={14} />
                Mobile
              </button>
            </div>

            <div className="flex items-center bg-[#111] rounded-lg border border-white/10 p-1">
            <button
              onClick={() => setViewMode("Web-Preview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${viewMode === "Web-Preview"
                ? "bg-white/10 text-brand-lighter"
                : "text-zinc-500 hover:text-zinc-300"
                }`}
            >
              <Globe size={14} />
              Web-Preview
            </button>
            <button
              onClick={() => setViewMode("clean")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${viewMode === "clean"
                ? "bg-white/10 text-brand-lighter"
                : "text-zinc-500 hover:text-zinc-300"
                }`}
            >
              <Layers size={14} />
              Clean
            </button>
            <button
              onClick={() => setViewMode("raw")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${viewMode === "raw"
                ? "bg-white/10 text-brand-lighter"
                : "text-zinc-500 hover:text-zinc-300"
                }`}
            >
              <Braces size={14} />
              Raw (Craft.js)
            </button>
            </div>
          </div>

          {/* Stats (inside tabs area) */}
          <div className="flex items-center justify-center gap-6 text-xs text-zinc-500 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-zinc-600">Page:</span>
              <select
                value={selectedPreviewPage?.slug ?? ""}
                onChange={(e) => setSelectedPreviewPageSlug(e.target.value || undefined)}
                disabled={previewPages.length === 0}
                className="bg-[#111] border border-white/10 rounded-md px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-50"
              >
                {previewPages.map((page) => (
                  <option key={page.slug} value={page.slug}>
                    {page.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span>{pageCount} pages</span>
              <span className="text-zinc-700">|</span>
              <span>
                {viewMode === "raw" ? rawNodeCount : cleanNodeCount} nodes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-600">Raw:</span>
              <span className="text-zinc-400">{formatBytes(rawMinBytes)}</span>
              <span className="text-zinc-700">→</span>
              <span className="text-zinc-600">Clean:</span>
              <span className="text-emerald-400">{formatBytes(cleanMinBytes)}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${reduction > 0
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-zinc-500/10 text-zinc-400"
                  }`}
              >
                -{reduction}%
              </span>
            </div>
          </div>
        </div>

        {/* Content: Web preview or JSON */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
            <p>Fetching latest clean data...</p>
          </div>
        ) : viewMode === "Web-Preview" ? (
          <div className={`py-6 h-full ${previewViewport === "desktop" ? "overflow-x-auto" : "flex justify-center"}`}>
            {cleanDoc ? (
              <div
                ref={previewRef}
                className={`bg-white transition-[width] duration-300 ease-out ${previewViewport === "desktop"
                    ? "min-h-[calc(100vh-200px)] mx-auto"
                    : "min-h-[calc(100vh-200px)] rounded-xl border border-white/10 overflow-hidden"
                  }`}
                style={
                  previewViewport === "desktop"
                    ? desktopPreviewStyle
                    : previewViewport === "tablet"
                    ? { width: 768, maxWidth: "100%" }
                    : previewViewport === "mobile"
                      ? { width: 390, maxWidth: "100%" }
                      : undefined
                }
              >
                <WebPreview
                  key={selectedPreviewPage?.slug ?? "default-page"}
                  doc={cleanDoc}
                  pageIndex={0}
                  initialPageSlug={selectedPreviewPage?.slug ?? initialPageSlug}
                  mobileBreakpoint={PREVIEW_MOBILE_BREAKPOINT}
                  enableFormInputs
                  builderParityMode={useBuilderParityMode}
                  simulatedWidth={
                    previewViewport === "desktop"
                      ? undefined
                      : previewViewport === "tablet"
                        ? 768
                        : 390
                  }
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-96 text-zinc-500 p-8 border border-white/10 rounded-xl">
                <p className="text-base mb-1">No page data</p>
                <p className="text-sm">Go back to the editor and press the play button to generate output.</p>
              </div>
            )}
          </div>
        ) : activeJson ? (
          <pre className="bg-[#111] rounded-xl border border-white/10 p-6 text-sm leading-relaxed overflow-auto max-h-[calc(100vh-200px)] font-mono text-zinc-300 whitespace-pre-wrap wrap-break-word">
            {activeJson}
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <p className="text-lg mb-2">No JSON data found</p>
            <p className="text-sm">
              Go back to the editor and press the play button to generate output.
            </p>
          </div>
        )}
      </div>

      {/* Publish confirmation – Publish now or Schedule for a date */}
      {showPublishDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-2">Publish site</h2>
            {scheduleInfo && (
              <p className="text-sm text-amber-400/90 mb-2">
                Already scheduled for {new Date(scheduleInfo.scheduledAt).toLocaleString()}. Setting a new date will replace it.
              </p>
            )}
            <p className="text-sm text-zinc-400 mb-4">
              {publishDomainName.trim()
                ? "Confirm your domain name. You can change it later in the dashboard."
                : "Domain name (subdomain) is required. Set it here or in Create project."}
            </p>
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-300">
                Domain name (subdomain) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={publishDomainName}
                onChange={(e) => {
                  setPublishDomainName(e.target.value);
                  setPublishDomainError("");
                }}
                placeholder="e.g. mystore → mystore.yourdomain.com"
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <p className="text-xs text-zinc-500">Only letters, numbers, and hyphens.</p>
              {publishDomainError && (
                <p className="text-xs text-red-400">{publishDomainError}</p>
              )}
            </div>
            <div className="flex gap-2 mb-4 p-1 bg-[#0a0a0a] rounded-lg">
              <button
                type="button"
                onClick={() => setPublishMode("now")}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${publishMode === "now" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                Publish now
              </button>
              <button
                type="button"
                onClick={() => setPublishMode("schedule")}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${publishMode === "schedule" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                Schedule for date
              </button>
            </div>
            {publishMode === "schedule" && (
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-300">
                  When should your edits go live?
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-zinc-500">Your current draft will go live at this date and time.</p>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowPublishDialog(false);
                  setPublishDomainName("");
                  setPublishDomainError("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              {publishMode === "now" ? (
                <button
                  type="button"
                  onClick={handlePublishConfirm}
                  disabled={publishing}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishing ? "Publishing…" : "Confirm & Publish"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleScheduleConfirm}
                  disabled={scheduling}
                  className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scheduling ? "Scheduling…" : "Set schedule"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showPublishedSuccessModal && publishedSubdomain && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-2">Published successfully</h2>
            <p className="text-sm text-zinc-400 mb-1">Do you want to open your website now?</p>
            <p className="text-xs text-zinc-500 mb-5">
              {typeof window !== 'undefined'
                ? getSubdomainSiteUrl(publishedSubdomain, window.location.origin).replace(/^https?:\/\//, '')
                : `${publishedSubdomain}.localhost`}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPublishedSuccessModal(false);
                  setPublishedSubdomain(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = publishedSubdomain;
                  setShowPublishedSuccessModal(false);
                  setPublishedSubdomain(null);
                  const url = getSubdomainSiteUrl(target, typeof window !== 'undefined' ? window.location.origin : null);
                  if (url !== '#') window.location.href = url;
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open website
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">Save Template</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Landing Page">Landing Page</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Blog">Blog</option>
                  <option value="Portfolio">Portfolio</option>
                  <option value="Business">Business</option>
                  <option value="Dashboard">Dashboard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Describe your template..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setTemplateName("");
                  setTemplateDescription("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-zinc-500">Loading...</div>}>
      <PreviewContent />
    </Suspense>
  );
}

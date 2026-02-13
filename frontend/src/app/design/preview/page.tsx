"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { ArrowLeft, Copy, Check, Download, Layers, Braces, Save, Globe, Upload } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { serializeCraftToClean, deserializeCleanToCraft } from "../_lib/serializer";
import { getDraft } from "../_lib/pageApi";
import { WebPreview } from "../_lib/webRenderer";
import { templateService } from "@/lib/templateService";
import { useAlert } from "@/app/m_dashboard/components/context/alert-context";
import { publishProject } from "@/lib/api";

const DEFAULT_PROJECT_ID = "Leb2oTDdXU3Jh2wdW1sI";

type ViewMode = "Web-Preview" | "clean" | "raw";

function PreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || DEFAULT_PROJECT_ID;
  const { showAlert } = useAlert();
  const [rawJson, setRawJson] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("Web-Preview");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("Landing Page");
  const [templateDescription, setTemplateDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        console.log(`📡 Preview: Fetching draft for Project: ${projectId}...`);
        const result = await getDraft(projectId);

        if (result.success && result.data) {
          console.log('✅ Preview: API result success. Keys in data:', Object.keys(result.data));

          if (result.data.content) {
            let content = result.data.content;

            // If already clean object, we still keep it as "rawJson" (as string) 
            // for the rest of the existing preview logic to work (it formats it etc.)
            if (typeof content === 'object') {
              console.log('✨ Data is CLEAN format (version:', content.version, ')');
              setRawJson(JSON.stringify(content));
            } else {
              setRawJson(content);
            }
            console.log('✅ Preview: Data loaded');
          } else {
            console.warn('⚠️ Preview: No content found in result data');
          }
        } else {
          console.warn('⚠️ Preview: API success=false or no data found');
        }
      } catch (error) {
        console.error('❌ Preview: Load error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId]);

  // Compute clean document
  const cleanDoc = useMemo(() => {
    if (!rawJson) return null;
    try {
      const parsed = JSON.parse(rawJson);
      // If it's already clean (BuilderDocument)
      if (parsed.version !== undefined && parsed.pages && parsed.nodes) {
        return parsed;
      }
      // Otherwise, it's raw Craft.js, serialize it
      return serializeCraftToClean(rawJson);
    } catch {
      return null;
    }
  }, [rawJson]);

  const cleanJson = useMemo(
    () => (cleanDoc ? JSON.stringify(cleanDoc, null, 2) : null),
    [cleanDoc]
  );

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

    setSaving(true);
    try {
      const template = templateService.saveTemplate(
        templateName.trim(),
        templateCategory,
        templateDescription.trim()
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

  const handlePublish = async () => {
    if (!projectId) {
      showAlert("No project selected.");
      return;
    }
    setPublishing(true);
    try {
      const res = await publishProject(projectId);
      if (res.success) {
        showAlert("Published! Your site is live at the subdomain.");
      } else {
        showAlert(res.message || "Publish failed.");
      }
    } catch (error) {
      console.error("Publish error:", error);
      showAlert(error instanceof Error ? error.message : "Publish failed.");
    } finally {
      setPublishing(false);
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
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-colors disabled:opacity-50"
            >
              <Upload size={14} />
              {publishing ? "Publishing…" : "Publish"}
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

      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-6">
        {/* View Toggle + Stats */}
        <div className="flex items-center justify-between">
          {/* Toggle */}
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

          {/* Stats */}
          <div className="flex items-center gap-6 text-xs text-zinc-500">
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
          <div className="flex justify-center py-6">
            <div className="w-full max-w-[1000px] min-h-[80vh] rounded-xl overflow-hidden bg-white">
              {cleanDoc ? (
                <WebPreview doc={cleanDoc} pageIndex={0} />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500 p-8">
                  <p className="text-base mb-1">No page data</p>
                  <p className="text-sm">Go back to the editor and press the play button to generate output.</p>
                </div>
              )}
            </div>
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

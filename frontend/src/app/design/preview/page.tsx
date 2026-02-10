"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Copy, Check, Download, Layers, Braces, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { serializeCraftToClean } from "../_lib/serializer";
import { templateService } from "@/lib/templateService";

const STORAGE_KEY = "craftjs_preview_json";

type ViewMode = "clean" | "raw";

export default function PreviewPage() {
  const router = useRouter();
  const [rawJson, setRawJson] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("clean");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("Landing Page");
  const [templateDescription, setTemplateDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) setRawJson(raw);
  }, []);

  // Compute clean document from raw Craft.js JSON
  const cleanDoc = useMemo(() => {
    if (!rawJson) return null;
    try {
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
      return JSON.stringify(JSON.parse(rawJson), null, 2);
    } catch {
      return rawJson;
    }
  }, [rawJson]);

  const activeJson = viewMode === "clean" ? cleanJson : rawFormatted;

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
      alert("Please fill in all fields");
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
        alert("Template saved successfully!");
        setShowSaveDialog(false);
        setTemplateName("");
        setTemplateDescription("");
        // Navigate to web-builder page
        router.push("/m_dashboard/web-builder");
      } else {
        alert("Failed to save template. Please try again.");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Error saving template. Please try again.");
    } finally {
      setSaving(false);
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
            <h1 className="text-lg font-semibold">JSON Output</h1>
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-6">
        {/* View Toggle + Stats */}
        <div className="flex items-center justify-between">
          {/* Toggle */}
          <div className="flex items-center bg-[#111] rounded-lg border border-white/10 p-1">
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
                {viewMode === "clean" ? cleanNodeCount : rawNodeCount} nodes
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

        {/* JSON Content */}
        {activeJson ? (
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

"use client";
import React, { useState, useMemo } from "react";
import { useEditor, Element } from "@craftjs/core";
import {
  ChevronLeft, ChevronRight, Box, Layers, Minus,
  ImageIcon, CheckSquare,
  RectangleHorizontal, Type, ChevronDown, LayoutTemplate, FileCode,
  Plus, Search, X, Video as VideoIcon,
} from "lucide-react";
import { DesignTooltip } from "../DesignTooltip";
import { AssetsPanel } from "./assetsPanel";
import { TemplatePanel } from "./templatePanel";
import { useCanvasTool } from "../CanvasToolContext";
import { useImportedComponents } from "../../_context/ImportedComponentsContext";
import { GROUPED_TEMPLATES as ASSETS_GROUPS } from "../../../_assets";
import { GROUPED_TEMPLATES as TEMPLATES_GROUPS } from "../../../_templates";
import { AssetLivePreview } from "./assetsPanel";
import { Container } from "../../_designComponents/Container/Container";
import { Text } from "../../_designComponents/Text/Text";
import { Image } from "../../_designComponents/Image/Image";
import { Video } from "../../_designComponents/Video/Video";
import { Button } from "../../_designComponents/Button/Button";
import { Accordion } from "../../_designComponents/Accordion/Accordion";
import { CRAFT_RESOLVER } from "../craftResolver";
import { ImportedBlock } from "../../_designComponents/ImportedBlock/ImportedBlock";

interface ComponentVariant {
  label: string;
  element?: React.ReactElement;
  dragElement?: React.ReactElement;
  isNewPage?: boolean;
  icon: React.ReactNode;
  /** tailwind bg + text color pair for the icon tile */
  iconStyle: string;
  /** solid color for hover state background */
  hoverColor?: string;
}

// Each component gets a vivid color pair: bg (subtle) + icon color + solid hover color
// Uses *-500 for icons so they're visible on both light and dark backgrounds
const COMP_STYLES: Record<string, { base: string; hoverColor: string }> = {
  Container:          { base: "bg-purple-500/15 text-purple-500",  hoverColor: "#a855f7" },
  Text:               { base: "bg-pink-500/15 text-pink-500",      hoverColor: "#ec4899" },
  Image:              { base: "bg-yellow-500/15 text-yellow-500",  hoverColor: "#eab308" },
  Video:              { base: "bg-indigo-500/15 text-indigo-500",  hoverColor: "#6366f1" },
  Button:             { base: "bg-red-500/15 text-red-500",        hoverColor: "#ef4444" },
  Accordion:          { base: "bg-fuchsia-500/15 text-fuchsia-500",hoverColor: "#d946ef" },
  "New Page":         { base: "bg-builder-accent/10 text-builder-accent", hoverColor: "#FFCC00" },
};

const COMPONENT_TOOLTIPS: Record<string, string> = {
  Container: "Flexible box for grouping and nesting elements",
  Text: "Add editable text — headings, paragraphs, labels",
  Image: "Add an image — upload from device or enter a URL",
  Video: "Embed a video — YouTube, Vimeo, or direct URL",
  Button: "Clickable button with customizable text, color and link",
  Accordion: "Expandable/collapsible content panels",
  "New Page": "Add a new blank page to the canvas",
};

export const ComponentsPanel = () => {
  const { connectors } = useEditor();
  const { activeTool } = useCanvasTool();
  const { items: importedItems } = useImportedComponents();
  const [panelView, setPanelView] = useState<"landing" | "blocks" | "templates" | "imports">("landing");
  const [searchQuery, setSearchQuery] = useState("");

  const pageComponent = CRAFT_RESOLVER.Page ?? Container;

  const FLOW_LAYOUT_COMPONENTS = new Set<unknown>([
    Container, Accordion, pageComponent,
  ]);

  const withFreePositionDefaults = (element: React.ReactElement): React.ReactElement => {
    const maybeCraftComponent = (element.props as { is?: unknown } | undefined)?.is ?? element.type;
    if (FLOW_LAYOUT_COMPONENTS.has(maybeCraftComponent)) return element;
    return React.cloneElement<any>(element as React.ReactElement<any>, {
      ...(element.props ?? {}),
      position: "absolute",
      top: "0px",
      left: "0px",
    } as any);
  };

  const WORKING_COMPONENTS: ComponentVariant[] = useMemo(() => [
    { label: "Container", icon: <Layers />,         iconStyle: COMP_STYLES.Container.base, hoverColor: COMP_STYLES.Container.hoverColor, element: <Element is={Container} padding={20} canvas /> },
    { label: "Text",      icon: <Type />,           iconStyle: COMP_STYLES.Text.base,      hoverColor: COMP_STYLES.Text.hoverColor,      element: <Text text="" fontSize={18} width="fit-content" /> },
    { label: "Image",     icon: <ImageIcon />,      iconStyle: COMP_STYLES.Image.base,     hoverColor: COMP_STYLES.Image.hoverColor,     element: <Image width="320px" height="220px" /> },
    { label: "Video",     icon: <VideoIcon />,      iconStyle: COMP_STYLES.Video.base,     hoverColor: COMP_STYLES.Video.hoverColor,     element: <Video width="320px" height="220px" /> },
    { label: "Button",    icon: <RectangleHorizontal />, iconStyle: COMP_STYLES.Button.base,    hoverColor: COMP_STYLES.Button.hoverColor,    element: <Element is={Button} canvas label="Click me" /> },
    { label: "Accordion", icon: <ChevronDown />,    iconStyle: COMP_STYLES.Accordion.base, hoverColor: COMP_STYLES.Accordion.hoverColor, element: <Accordion /> },
    { label: "New Page",  icon: <LayoutTemplate />, iconStyle: COMP_STYLES["New Page"].base, hoverColor: COMP_STYLES["New Page"].hoverColor, isNewPage: true, dragElement: <Element is={pageComponent} canvas /> },
  ], [pageComponent]);

  const allSearchableItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: Array<{
      id: string; label: string; category: string; element: React.ReactElement;
      type: "component" | "block" | "template" | "import";
      icon?: React.ReactNode; iconStyle?: string; hoverColor?: string;
      dragElement?: React.ReactElement; isNewPage?: boolean; item?: any;
    }> = [];

    WORKING_COMPONENTS.forEach(comp => {
      if (comp.label.toLowerCase().includes(query)) {
        results.push({ id: `comp-${comp.label}`, label: comp.label, category: "Components",
          element: comp.element!, dragElement: comp.dragElement, icon: comp.icon,
          iconStyle: comp.iconStyle, hoverColor: (COMP_STYLES[comp.label] as any)?.hoverColor,
          type: "component", isNewPage: comp.isNewPage });
      }
    });
    ASSETS_GROUPS.forEach(group => {
      group.items.forEach((item: any) => {
        if (item.label.toLowerCase().includes(query))
          results.push({ id: `asset-${group.folder}-${item.label}`, label: item.label,
            category: `Block: ${group.folder}`, element: item.element,
            icon: <Box className="w-4 h-4" />, type: "block", item });
      });
    });
    TEMPLATES_GROUPS.forEach(group => {
      group.items.forEach((item: any) => {
        if (item.label.toLowerCase().includes(query))
          results.push({ id: `template-${group.folder}-${item.label}`, label: item.label,
            category: `Template: ${group.folder}`, element: item.element, type: "template" });
      });
    });
    importedItems.forEach(item => {
      if (item.name.toLowerCase().includes(query))
        results.push({ id: `import-${item.id}`, label: item.name, category: "My Imports",
          element: <Element is={ImportedBlock} blockName={item.name} blockCss={item.css} blockHtml={item.html} canvas />,
          icon: <FileCode className="w-4 h-4" />, type: "import" });
    });
    return results;
  }, [searchQuery, WORKING_COMPONENTS, importedItems]);

  // ── Component card ──────────────────────────────────────────────────────────
  const renderComponentItem = (v: any) => (
    <div
      key={v.id || v.label}
      ref={(ref) => {
        if (!ref || activeTool === "hand") return;
        const el = v.dragElement || v.element;
        if (el) connectors.create(ref, withFreePositionDefaults(el));
      }}
      {...(v.isNewPage
        ? { "data-component-new-page": "true", "data-drag-source": "component" }
        : { "data-drag-source": "component" })}
      className="builder-comp-card group relative flex flex-col gap-1.5 cursor-grab active:cursor-grabbing"
    >
      {/* Icon tile */}
      <DesignTooltip content={COMPONENT_TOOLTIPS[v.label] || v.label} position="right">
        <div
          className={`
            relative h-16 w-full rounded-xl overflow-hidden
            flex flex-col items-center justify-center
            transition-all duration-200
            border border-[var(--builder-border)]
            group-hover:border-transparent
            group-hover:scale-[1.03]
            group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.18)]
            ${v.iconStyle || "bg-[var(--builder-surface-2)] text-[var(--builder-text-muted)]"}
          `}
          style={{ '--tile-hover': v.hoverColor } as React.CSSProperties}
        >
        {/* solid color fill on hover */}
        <div className="builder-tile-hover-bg absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl"
          style={{ backgroundColor: v.hoverColor || 'var(--builder-purple)' }} />

        <div className="builder-comp-icon relative z-10 transition-all duration-200 group-hover:scale-110 group-hover:text-white">
          {React.isValidElement(v.icon)
            ? React.cloneElement(v.icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })
            : v.icon}
        </div>

        {/* + badge on hover */}
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100">
          <div className="w-3.5 h-3.5 rounded-full bg-white/30 flex items-center justify-center">
            <Plus className="w-2 h-2 text-white" strokeWidth={3} />
          </div>
        </div>
        </div>
      </DesignTooltip>

      <span className="text-[9px] font-bold text-[var(--builder-text-muted)] text-center group-hover:text-[var(--builder-text)] transition-colors truncate px-0.5 uppercase tracking-tight">
        {v.label}
      </span>
    </div>
  );

  const renderSearchResultItem = (v: any) => {
    if (v.type === "component") return renderComponentItem(v);
    if (v.type === "import") {
      return (
        <div key={v.id}
          ref={(ref) => { if (!ref || activeTool === "hand") return; connectors.create(ref, withFreePositionDefaults(v.element)); }}
          className="builder-comp-card group relative flex flex-col gap-1.5 cursor-grab active:cursor-grabbing"
        >
          <div className="relative h-16 w-full rounded-xl overflow-hidden flex flex-col items-center justify-center border border-[var(--builder-border)] group-hover:border-[var(--builder-border-mid)] bg-[var(--builder-surface-2)] text-[var(--builder-text-muted)] transition-all duration-200 group-hover:scale-[1.03]">
            <FileCode className="w-5 h-5 builder-comp-icon transition-all duration-200 group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_var(--builder-icon-glow)]" />
          </div>
          <span className="text-[9px] font-bold text-[var(--builder-text-muted)] text-center group-hover:text-[var(--builder-text)] transition-colors truncate px-0.5 uppercase tracking-tight">{v.label}</span>
        </div>
      );
    }
    return (
      <div key={v.id}
        ref={(ref) => { if (!ref || activeTool === "hand") return; connectors.create(ref, v.element); }}
        className="builder-comp-card group relative flex flex-col gap-1.5 cursor-grab active:cursor-grabbing col-span-1"
      >
        <div className="relative h-16 w-full rounded-xl overflow-hidden flex flex-col items-center justify-center border border-[var(--builder-border)] group-hover:border-[var(--builder-border-mid)] bg-[var(--builder-surface-2)] transition-all duration-200 group-hover:scale-[1.03]">
          {v.type === "block" ? (
            <div className="flex items-center justify-center w-full px-1">
              <AssetLivePreview item={v.item}
                previewMode={v.category.toLowerCase().includes("icons") ? "icon" : v.category.toLowerCase().includes("shapes") ? "shape" : "full"}
                maxHeight={60} />
            </div>
          ) : (
            <LayoutTemplate className="w-5 h-5 text-[var(--builder-text-muted)] builder-comp-icon transition-all duration-200 group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_var(--builder-icon-glow)]" />
          )}
        </div>
        <span className="text-[9px] font-bold text-[var(--builder-text-muted)] text-center group-hover:text-[var(--builder-text)] transition-colors truncate px-0.5 uppercase tracking-tight">{v.label}</span>
      </div>
    );
  };

  // ── Back button shared style ─────────────────────────────────────────────────
  const backBtn = (onClick: () => void) => (
    <DesignTooltip content="Back to components" position="right">
      <button onClick={onClick}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--builder-text-muted)] hover:text-[var(--builder-accent)] hover:bg-[var(--builder-surface-2)] transition-all border border-[var(--builder-border)]">
        <ChevronLeft className="w-4 h-4" />
      </button>
    </DesignTooltip>
  );

  // ── Resource row ─────────────────────────────────────────────────────────────
  const resourceRow = (item: { id: string; label: string; sub: string; icon: React.ReactNode; action: () => void; tooltip: string }) => (
    <DesignTooltip key={item.id} content={item.tooltip} position="top">
      <button onClick={item.action}
        className="group relative w-full h-14 rounded-xl flex items-center px-3 gap-3 overflow-hidden cursor-pointer transition-all duration-200
          bg-[var(--builder-surface-2)] hover:bg-[var(--builder-surface-3)]
          border border-[var(--builder-border)] hover:border-[var(--builder-border-mid)]
          hover:shadow-[0_0_12px_var(--builder-purple-glow)]"
      >
      {/* accent left stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--builder-accent)] opacity-0 group-hover:opacity-100 transition-opacity rounded-l-xl" />

      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
        bg-[var(--builder-surface-3)] text-[var(--builder-purple-light)]
        group-hover:text-[var(--builder-accent)] group-hover:bg-[var(--builder-surface-hover)]
        transition-all duration-200 group-hover:drop-shadow-[0_0_6px_var(--builder-accent-glow)]">
        {React.isValidElement(item.icon)
          ? React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })
          : item.icon}
      </div>

      <div className="flex flex-col items-start min-w-0">
        <span className="text-[10px] font-black tracking-widest uppercase text-[var(--builder-text)] truncate">{item.label}</span>
        <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--builder-text-faint)] group-hover:text-[var(--builder-text-muted)] transition-colors">{item.sub}</span>
      </div>

      <ChevronRight className="ml-auto w-3.5 h-3.5 text-[var(--builder-text-faint)] group-hover:text-[var(--builder-accent)] transition-all group-hover:translate-x-0.5 shrink-0" />
      </button>
    </DesignTooltip>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-transparent select-none">

      {/* Search */}
      <div className="px-3 py-2 shrink-0">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--builder-text-faint)] group-focus-within:text-[var(--builder-accent)] transition-colors" />
          <input type="text" placeholder="Search components…"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 rounded-lg pl-9 pr-8 text-xs
              bg-[var(--builder-surface-2)] border border-[var(--builder-border)]
              text-[var(--builder-text)] placeholder:text-[var(--builder-text-faint)]
              focus:outline-none focus:border-[var(--builder-border-mid)]
              focus:shadow-[0_0_0_2px_var(--builder-purple-glow)]
              transition-all"
          />
          {searchQuery && (
            <DesignTooltip content="Clear search" position="left">
              <button onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--builder-text-faint)] hover:text-[var(--builder-accent)] transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </DesignTooltip>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">

        {/* Search results */}
        <div className={`absolute inset-0 px-3 overflow-y-auto no-scrollbar transition-all duration-300 z-10
          ${searchQuery.trim() ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none translate-y-3"}`}>
          {allSearchableItems.length > 0 ? (
            <div className="flex flex-col gap-5 py-3 pb-24">
              {(["component","block","template","import"] as const).map(type => {
                const items = allSearchableItems.filter((r: { type: string }) => r.type === type);
                if (!items.length) return null;
                return (
                  <div key={type} className="flex flex-col gap-2">
                    <span className="text-[9px] font-black text-[var(--builder-text-faint)] uppercase tracking-[0.2em] px-0.5">
                      {type === "component" ? "Components" : type === "block" ? "Pre-built Blocks" : type === "template" ? "Templates" : "Imports"}
                    </span>
                    <div className="grid grid-cols-3 gap-2">{items.map(renderSearchResultItem)}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-2 opacity-40">
              <Search className="w-8 h-8 text-[var(--builder-text-muted)]" />
              <span className="text-xs text-[var(--builder-text-muted)] font-medium">No results</span>
            </div>
          )}
        </div>

        {/* Landing view */}
        <div className={`absolute inset-0 px-3 overflow-y-auto no-scrollbar transition-all duration-300 py-2 pb-24 space-y-5
          ${panelView === "landing" && !searchQuery.trim() ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}`}>

          {/* Components grid */}
          <div className="grid grid-cols-3 gap-2">
            {WORKING_COMPONENTS.map(renderComponentItem)}
          </div>

          {/* Divider with yellow accent */}
          <div className="flex items-center gap-2 px-0.5">
            <div className="h-px flex-1 bg-[var(--builder-border)]" />
            <span className="text-[8px] font-black uppercase tracking-[0.25em] text-[var(--builder-accent)]">Resources</span>
            <div className="h-px flex-1 bg-[var(--builder-border)]" />
          </div>

          {/* Resource rows */}
          <div className="flex flex-col gap-2">
            {[
              { id: "blocks",    label: "Pre-built Blocks", sub: "Ready-made sections",       icon: <Box />,           action: () => setPanelView("blocks"),    tooltip: "Browse pre-built sections and drag onto your page" },
              { id: "templates", label: "Templates",        sub: "Full page layouts",          icon: <LayoutTemplate />, action: () => setPanelView("templates"), tooltip: "Choose a full page template to start with" },
              { id: "imports",   label: "My Imports",       sub: `${importedItems.length} custom modules`, icon: <FileCode />, action: () => setPanelView("imports"),   tooltip: "View your imported HTML blocks and components" },
            ].map(resourceRow)}
          </div>
        </div>

        {/* Blocks view */}
        <div className={`absolute inset-0 transition-all duration-300 ${panelView === "blocks" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"}`}>
          <div className="h-full flex flex-col p-3 pt-0">
            <div className="flex items-center gap-2 py-3 sticky top-0 bg-[var(--builder-surface)] z-10">
              {backBtn(() => setPanelView("landing"))}
              <span className="text-[10px] font-black text-[var(--builder-text)] uppercase tracking-widest">Pre-built Blocks</span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-4"><AssetsPanel /></div>
          </div>
        </div>

        {/* Templates view */}
        <div className={`absolute inset-0 transition-all duration-300 ${panelView === "templates" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"}`}>
          <div className="h-full flex flex-col p-3 pt-0">
            <div className="flex items-center gap-2 py-3 sticky top-0 bg-[var(--builder-surface)] z-10">
              {backBtn(() => setPanelView("landing"))}
              <span className="text-[10px] font-black text-[var(--builder-text)] uppercase tracking-widest">Templates</span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-20"><TemplatePanel /></div>
          </div>
        </div>

        {/* Imports view */}
        <div className={`absolute inset-0 transition-all duration-300 ${panelView === "imports" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"}`}>
          <div className="h-full flex flex-col p-3 pt-0">
            <div className="flex items-center gap-2 py-3 sticky top-0 bg-[var(--builder-surface)] z-10">
              {backBtn(() => setPanelView("landing"))}
              <span className="text-[10px] font-black text-[var(--builder-text)] uppercase tracking-widest">My Imports</span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-20 space-y-3">
              {importedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 opacity-40">
                  <FileCode className="w-8 h-8 text-[var(--builder-text-muted)]" />
                  <span className="text-xs text-[var(--builder-text-muted)] font-medium">No imports yet</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {importedItems.map((item) => (
                    <div key={item.id}
                      ref={(ref) => {
                        if (!ref || activeTool === "hand") return;
                        connectors.create(ref, withFreePositionDefaults(<Element is={ImportedBlock} blockName={item.name} blockCss={item.css} blockHtml={item.html} canvas />));
                      }}
                      className="group p-2.5 rounded-xl cursor-grab transition-all duration-200
                        bg-[var(--builder-surface-2)] hover:bg-[var(--builder-surface-3)]
                        border border-[var(--builder-border)] hover:border-[var(--builder-border-mid)]">
                      <div className="h-12 rounded-lg mb-2 flex items-center justify-center
                        bg-[var(--builder-surface-3)] border border-dashed border-[var(--builder-border)]">
                        <FileCode className="w-5 h-5 text-[var(--builder-text-faint)] group-hover:text-[var(--builder-purple-light)] transition-colors" />
                      </div>
                      <span className="text-[9px] text-[var(--builder-text-muted)] font-semibold line-clamp-2 uppercase tracking-tight">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

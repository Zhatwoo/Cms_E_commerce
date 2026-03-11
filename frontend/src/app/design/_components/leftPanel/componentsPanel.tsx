import React, { useState, useMemo } from "react";
import { useEditor, Element } from "@craftjs/core";
import { ChevronLeft, ChevronRight, Layout, Type, MousePointer2, Box, Layers, Columns, Grid, Maximize, Minus, BookOpen, Briefcase, Frame as FrameIcon, Image as ImageIcon, Video as VideoIcon, Star, Link as LinkIcon, Table, List as ListIcon, Badge, AlertCircle, PlayCircle, Mail, MapPin, Code, Sliders, CheckSquare, Circle as RadioIcon, Calendar, Clock, Upload, ToggleRight, Phone, Search, Key, ChevronDown, LayoutTemplate, Component, X, FolderOpen, FileCode, Plus } from "lucide-react";
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
import { Divider } from "../../_designComponents/Divider/Divider";
import { Section } from "../../_designComponents/Section/Section";
import { Row } from "../../_designComponents/Row/Row";
import { Column } from "../../_designComponents/Column/Column";
import { Tabs } from "../../_designComponents/Tabs/Tabs";
import { CRAFT_RESOLVER } from "../craftResolver";
import { ImportedBlock } from "../../_designComponents/ImportedBlock/ImportedBlock";
import { Spacer } from "../../_designComponents/Spacer/Spacer";
import { Pagination } from "../../_designComponents/Pagination/Pagination";

interface ComponentVariant {
  label: string;
  preview: string;
  previewBg?: string;
  element?: React.ReactElement;
  dragElement?: React.ReactElement;
  isNewPage?: boolean;
  icon?: React.ReactNode;
  color?: string;
}

export const ComponentsPanel = () => {
  const { connectors } = useEditor();
  const { activeTool } = useCanvasTool();
  const { items: importedItems } = useImportedComponents();
  const [panelView, setPanelView] = useState<"landing" | "blocks" | "templates" | "imports">("landing");
  const [searchQuery, setSearchQuery] = useState("");

  const pageComponent = CRAFT_RESOLVER.Page ?? Container;

  const FLOW_LAYOUT_COMPONENTS = new Set<unknown>([
    Section,
    Container,
    Row,
    Column,
    Spacer,
    pageComponent,
  ]);

  const withFreePositionDefaults = (element: React.ReactElement): React.ReactElement => {
    const maybeCraftComponent = (element.props as { is?: unknown } | undefined)?.is ?? element.type;
    if (FLOW_LAYOUT_COMPONENTS.has(maybeCraftComponent)) {
      return element;
    }

    return React.cloneElement<any>(element as React.ReactElement<any>, {
      position: "absolute",
      top: "0px",
      left: "0px",
      ...(element.props ?? {}),
    } as any);
  };

  const WORKING_COMPONENTS: ComponentVariant[] = useMemo(() => [
    { label: "Section", preview: "Section", element: <Element is={Section} canvas />, icon: <Box className="w-5 h-5" />, color: "bg-blue-500/10" },
    { label: "Container", preview: "Container", element: <Element is={Container} padding={20} canvas />, icon: <Layers className="w-5 h-5" />, color: "bg-purple-500/10" },
    { label: "Row", preview: "Row", element: <Element is={Row} canvas />, icon: <Minus className="w-5 h-5" />, color: "bg-orange-500/10" },
    { label: "Column", preview: "Column", element: <Element is={Column} canvas />, icon: <Columns className="w-5 h-5" />, color: "bg-emerald-500/10" },
    {
      label: "Text",
      preview: "Text",
      element: <Text text="" fontSize={18} width="220px" position="absolute" left="0px" top="0px" />,
      icon: <Type className="w-5 h-5" />,
      color: "bg-pink-500/10",
    },
    { label: "Image", preview: "Image", element: <Image width="320px" height="220px" />, icon: <ImageIcon className="w-5 h-5" />, color: "bg-yellow-500/10" },
    { label: "Video", preview: "Video", element: <Video width="320px" height="220px" />, icon: <VideoIcon className="w-5 h-5" />, color: "bg-purple-500/10" },
    { label: "Spacer", preview: "Spacer", element: <Spacer />, icon: <Maximize className="w-5 h-5" />, color: "bg-slate-500/10" },
    { label: "Button", preview: "Button", element: <Element is={Button} canvas label="Click me" />, icon: <MousePointer2 className="w-5 h-5" />, color: "bg-red-500/10" },
    { label: "Pagination", preview: "Pagination", element: <Pagination />, icon: <ListIcon className="w-5 h-5" />, color: "bg-indigo-500/10" },
    { label: "Divider", preview: "── Divider ──", element: <Divider />, icon: <Minus className="w-5 h-5" />, color: "bg-gray-500/10" },
    {
      label: "Tabs",
      preview: "Tabs",
      element: <Tabs tabs={[{ id: "tab-1", title: "Tab 1", content: "Tab 1 Content" }]} activeTabId="tab-1" />,
      icon: <Layout className="w-5 h-5" />,
      color: "bg-cyan-500/10"
    },
    {
      label: "New Page",
      preview: "New Page",
      isNewPage: true,
      dragElement: <Element is={pageComponent} canvas />,
      icon: <LayoutTemplate className="w-5 h-5" />,
      color: "bg-brand-light/20"
    },
  ], [pageComponent]);

  const allSearchableItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();

    const results: Array<{
      id: string;
      label: string;
      category: string;
      element: React.ReactElement;
      type: "component" | "block" | "template" | "import";
      icon?: React.ReactNode;
      color?: string;
      dragElement?: React.ReactElement;
      // Pre-built details
      item?: any;
    }> = [];

    // 1. Basic Components
    WORKING_COMPONENTS.forEach(comp => {
      if (comp.label.toLowerCase().includes(query)) {
        results.push({
          id: `comp-${comp.label}`,
          label: comp.label,
          category: "Components",
          element: comp.element!,
          dragElement: comp.dragElement,
          icon: comp.icon,
          color: comp.color,
          type: "component"
        });
      }
    });

    // 2. Pre-built Blocks (Assets)
    ASSETS_GROUPS.forEach(group => {
      group.items.forEach((item: any) => {
        if (item.label.toLowerCase().includes(query)) {
          results.push({
            id: `asset-${group.folder}-${item.label}`,
            label: item.label,
            category: `Block: ${group.folder}`,
            element: item.element,
            icon: <Box className="w-4 h-4" />,
            type: "block",
            item: item
          });
        }
      });
    });

    // 3. Templates
    TEMPLATES_GROUPS.forEach(group => {
      group.items.forEach((item: any) => {
        if (item.label.toLowerCase().includes(query)) {
          results.push({
            id: `template-${group.folder}-${item.label}`,
            label: item.label,
            category: `Template: ${group.folder}`,
            element: item.element,
            type: "template"
          });
        }
      });
    });

    // 4. Imports
    importedItems.forEach(item => {
      if (item.name.toLowerCase().includes(query)) {
        results.push({
          id: `import-${item.id}`,
          label: item.name,
          category: "My Imports",
          element: <Element is={ImportedBlock} blockName={item.name} blockCss={item.css} blockHtml={item.html} canvas />,
          icon: <FileCode className="w-4 h-4" />,
          type: "import"
        });
      }
    });

    return results;
  }, [searchQuery, WORKING_COMPONENTS, importedItems]);

  const searchResults = allSearchableItems;

  const renderComponentItem = (v: any) => (
    <div
      key={v.id || v.label}
      ref={(ref) => {
        if (!ref || activeTool === "hand") return;
        const dragElement = v.dragElement || v.element;
        if (dragElement) {
          connectors.create(ref, withFreePositionDefaults(dragElement));
        }
      }}
      className="group relative flex flex-col gap-1.5 cursor-grab active:cursor-grabbing"
    >
      <div className={`h-16 w-full ${v.color || "bg-brand-white/5"} rounded-lg border border-brand-medium/20 flex flex-col items-center justify-center transition-all duration-300 group-hover:bg-brand-white/10 group-hover:border-brand-medium/50 group-hover:shadow-md group-hover:-translate-y-0.5 overflow-hidden`}>
        <div className="text-brand-light/80 group-hover:text-white group-hover:scale-110 transition-all duration-300">
          {React.isValidElement(v.icon)
            ? React.cloneElement(v.icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })
            : v.icon}
        </div>
        <div className="absolute inset-0 bg-brand-blue/0 group-hover:bg-brand-blue/5 transition-colors" />
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-300">
          <div className="w-4 h-4 rounded-full bg-brand-blue flex items-center justify-center text-white shadow-lg shadow-brand-blue/30 scale-75 group-hover:scale-100 transition-transform">
            <Plus className="w-2.5 h-2.5" />
          </div>
        </div>
      </div>
      <span className="text-[9px] font-bold text-brand-lighter text-center group-hover:text-brand-white transition-colors truncate px-0.5 uppercase tracking-tighter">
        {v.label}
      </span>
    </div>
  );

  const renderSearchResultItem = (v: any) => {
    if (v.type === "component") return renderComponentItem(v);

    if (v.type === "import") {
      return (
        <div
          key={v.id}
          ref={(ref) => {
            if (!ref || activeTool === "hand") return;
            connectors.create(ref, withFreePositionDefaults(v.element));
          }}
          className="group relative flex flex-col gap-1.5 cursor-grab active:cursor-grabbing"
        >
          <div className="h-16 w-full bg-brand-white/5 rounded-lg border border-brand-medium/20 flex flex-col items-center justify-center transition-all duration-300 group-hover:bg-brand-white/10 group-hover:border-brand-medium/50 overflow-hidden">
            <div className="text-brand-light/80 group-hover:text-white transition-all transform group-hover:scale-110">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus className="w-2.5 h-2.5 text-brand-blue" />
            </div>
          </div>
          <span className="text-[9px] font-bold text-brand-lighter text-center group-hover:text-brand-white truncate px-0.5 uppercase tracking-tighter">
            {v.label}
          </span>
        </div>
      );
    }

    // Pre-built Blocks & Templates
    return (
      <div
        key={v.id}
        ref={(ref) => {
          if (!ref || activeTool === "hand") return;
          connectors.create(ref, v.element);
        }}
        className="group relative flex flex-col gap-1.5 cursor-grab active:cursor-grabbing col-span-1"
      >
        <div className="h-16 w-full bg-brand-white/5 rounded-lg border border-brand-medium/20 flex flex-col items-center justify-center transition-all duration-300 group-hover:bg-brand-white/10 group-hover:border-brand-medium/50 overflow-hidden">
          {v.type === "block" ? (
            <div className="flex items-center justify-center w-full px-1">
              <AssetLivePreview
                item={v.item}
                previewMode={v.category.toLowerCase().includes("icons") ? "icon" : v.category.toLowerCase().includes("shapes") ? "shape" : "full"}
                maxHeight={60}
              />
            </div>
          ) : (
            <LayoutTemplate className="w-4 h-4 text-brand-light/50" />
          )}
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus className="w-2.5 h-2.5 text-brand-blue" />
          </div>
        </div>
        <span className="text-[9px] font-bold text-brand-lighter text-center group-hover:text-brand-white truncate px-0.5 uppercase tracking-tighter">
          {v.label}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-transparent select-none">
      {/* Search Header */}
      <div className="px-4 py-2 flex flex-col gap-3 z-20">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-medium group-focus-within:text-brand-blue transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 bg-brand-dark/40 border border-brand-medium/20 rounded-lg pl-9 pr-4 text-xs text-brand-lighter placeholder:text-brand-medium/50 focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-medium hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {/* Search Results */}
        <div
          className={`absolute inset-0 px-4 overflow-y-auto no-scrollbar transition-all duration-300 ease-out z-10 ${searchQuery.trim() ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none translate-y-4"
            }`}
        >
          {searchResults.length > 0 ? (
            <div className="flex flex-col gap-6 py-4 pb-24">
              {/* Group results by type or category for better UX */}
              {["component", "block", "template", "import"].map(type => {
                const items = searchResults.filter(r => r.type === type);
                if (items.length === 0) return null;

                return (
                  <div key={type} className="flex flex-col gap-3">
                    <span className="text-[9px] font-bold text-brand-medium uppercase tracking-[0.2em] px-1 opacity-50">
                      {type === "component" ? "Basic Components" : type === "block" ? "Pre-built Blocks" : type === "template" ? "Templates" : "Imports"}
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      {items.map(renderSearchResultItem)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
              <Search className="w-10 h-10 text-brand-light" />
              <span className="text-xs text-brand-light font-medium">No results found</span>
            </div>
          )}
        </div>

        {/* Home View */}
        <div
          className={`absolute inset-0 px-4 overflow-y-auto no-scrollbar space-y-6 transition-all duration-300 ease-out py-2 pb-24 ${panelView === "landing" && !searchQuery.trim() ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
            }`}
        >
          {/* Main Components Grid */}
          <div className="grid grid-cols-3 gap-3">
            {WORKING_COMPONENTS.map(renderComponentItem)}
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <span className="text-[10px] font-bold text-brand-medium uppercase tracking-[0.2em] px-1 opacity-50">
              Resources
            </span>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { id: "blocks", label: "PRE-BUILT BLOCKS", sub: "Pre-built Sections", icon: <Box className="w-5 h-5" />, action: () => setPanelView("blocks") },
                { id: "templates", label: "TEMPLATES", sub: "Full Page Layouts", icon: <LayoutTemplate className="w-5 h-5" />, action: () => setPanelView("templates") },
                { id: "imports", label: "MY IMPORTS", sub: `${importedItems.length} custom modules`, icon: <FileCode className="w-5 h-5" />, action: () => setPanelView("imports") }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="group relative h-16 bg-brand-white/5 rounded-xl flex items-center p-4 border border-brand-medium/30 hover:bg-brand-white/10 transition-all duration-300 hover:border-brand-medium/50 overflow-hidden shadow-sm shrink-0"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand-dark/50 flex items-center justify-center text-brand-light mr-3 group-hover:text-white transition-colors border border-white/5 shadow-inner">
                    {item.icon}
                  </div>
                  <div className="flex flex-col items-start relative z-10 transition-transform group-hover:translate-x-1">
                    <span className="text-brand-white text-xs font-black tracking-widest uppercase truncate">{item.label}</span>
                    <span className="text-[8px] text-brand-medium font-bold uppercase tracking-[0.1em] opacity-60 group-hover:opacity-100">{item.sub}</span>
                  </div>
                  <ChevronRight className="ml-auto w-4 h-4 text-brand-medium group-hover:text-brand-white transition-all transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Blocks View */}
        <div
          className={`absolute inset-0 transition-all duration-300 ease-out ${panelView === "blocks" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"}`}
        >
          <div className="h-full flex flex-col p-4 pt-0">
            <div className="flex items-center gap-3 py-4 sticky top-0 bg-brand-dark z-10">
              <button onClick={() => setPanelView("landing")} className="w-8 h-8 rounded-lg bg-brand-light/10 flex items-center justify-center text-brand-light hover:text-white transition-all border border-white/5"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-[10px] font-black text-brand-lighter uppercase tracking-widest">PRE-BUILT BLOCKS</span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
              <AssetsPanel />
            </div>
          </div>
        </div>

        {/* Templates View */}
        <div
          className={`absolute inset-0 transition-all duration-300 ease-out ${panelView === "templates" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"}`}
        >
          <div className="h-full flex flex-col p-4 pt-0">
            <div className="flex items-center gap-3 py-4 sticky top-0 bg-brand-dark z-10">
              <button onClick={() => setPanelView("landing")} className="w-8 h-8 rounded-lg bg-brand-light/10 flex items-center justify-center text-brand-light hover:text-white transition-all border border-white/5"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-[10px] font-black text-brand-lighter uppercase tracking-widest">TEMPLATES</span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
              <TemplatePanel />
            </div>
          </div>
        </div>

        {/* Imports View */}
        <div
          className={`absolute inset-0 transition-all duration-300 ease-out ${panelView === "imports" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"}`}
        >
          <div className="h-full flex flex-col p-4 pt-0">
            <div className="flex items-center gap-3 py-4 sticky top-0 bg-brand-dark z-10">
              <button onClick={() => setPanelView("landing")} className="w-8 h-8 rounded-lg bg-brand-light/10 flex items-center justify-center text-brand-light hover:text-white transition-all border border-white/5"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-[10px] font-black text-brand-lighter uppercase tracking-widest">MY IMPORTS</span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-20 space-y-4">
              {importedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
                  <FileCode className="w-10 h-10 text-brand-light" />
                  <span className="text-xs text-brand-light font-medium">No imports yet</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {importedItems.map((item) => (
                    <div
                      key={item.id}
                      ref={(ref) => {
                        if (!ref || activeTool === "hand") return;
                        connectors.create(ref, withFreePositionDefaults(<Element is={ImportedBlock} blockName={item.name} blockCss={item.css} blockHtml={item.html} canvas />));
                      }}
                      className="group bg-brand-white/5 p-3 rounded-xl hover:bg-brand-white/10 transition-all border border-brand-medium/30 cursor-grab"
                    >
                      <div className="h-14 bg-brand-medium/20 rounded-lg mb-2 border border-dashed border-brand-medium/50 flex items-center justify-center"><FileCode className="w-6 h-6 text-brand-light/50" /></div>
                      <span className="text-[10px] text-brand-white font-semibold line-clamp-2 uppercase tracking-tighter">{item.name}</span>
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


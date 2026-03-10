import React, { useState } from "react";
import { useEditor, Element } from "@craftjs/core";
import { ChevronLeft, ChevronRight, Layout, Type, MousePointer2, Box, Layers, Columns, Grid, Maximize, Minus, BookOpen, Briefcase, Frame as FrameIcon, Image as ImageIcon, Video, Star, Link as LinkIcon, Table, List as ListIcon, Badge, AlertCircle, PlayCircle, Mail, MapPin, Code, Sliders, CheckSquare, Circle as RadioIcon, Calendar, Clock, Upload, ToggleRight, Phone, Search, Key, ChevronDown, LayoutTemplate, Component, X, FolderOpen } from "lucide-react";
import { AssetsPanel, AssetLivePreview, AssetItem } from "./assetsPanel";
import { TemplatePanel } from "./templatePanel";
import { GROUPED_TEMPLATES } from "../../../_assets";
import { useCanvasTool } from "../CanvasToolContext";
import { Container } from "../../_designComponents/Container/Container";
import { Text } from "../../_designComponents/Text/Text";
import { Image } from "../../_designComponents/Image/Image";
import { Button } from "../../_designComponents/Button/Button";
import { Divider } from "../../_designComponents/Divider/Divider";
import { Section } from "../../_designComponents/Section/Section";
import { Row } from "../../_designComponents/Row/Row";
import { Column } from "../../_designComponents/Column/Column";
import { Frame } from "../../_designComponents/Frame/Frame";
import { CRAFT_RESOLVER } from "../craftResolver";

interface ComponentVariant {
  label: string;
  preview: string;
  previewBg?: string;
  element?: React.ReactElement;
  dragElement?: React.ReactElement;
  isNewPage?: boolean;
}

interface ComponentElement {
  name: string;
  icon: React.ReactNode;
  variants: ComponentVariant[];
}

interface Subcategory {
  name: string;
  elements: ComponentElement[];
}

interface Category {
  name: string;
  icon: React.ReactNode;
  subcategories: Subcategory[];
}

export const ComponentsPanel = () => {
  const { connectors } = useEditor();
  const { activeTool } = useCanvasTool();
  const [panelView, setPanelView] = useState<"landing" | "categories" | "subcategories" | "elements" | "variants" | "blocks" | "templates">("landing");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<Subcategory | null>(null);
  const [activeElement, setActiveElement] = useState<ComponentElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const pageComponent = CRAFT_RESOLVER.Page ?? Container;
  const FLOW_LAYOUT_COMPONENTS = new Set<unknown>([
    Section,
    Container,
    Row,
    Column,
    Frame,
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

  // ... (COMPONENTS_DATA stays the same)
  const COMPONENTS_DATA: Category[] = [
    {
      name: "Layout",
      icon: <Layout className="w-5 h-5" />,
      subcategories: [
        {
          name: "Core Layout",
          elements: [
            { name: "Section", icon: <Box className="w-4 h-4" />, variants: [{ label: "Section", preview: "━━ Section ━━", element: <Element is={Section} canvas /> }] },
            { name: "Container", icon: <Layers className="w-4 h-4" />, variants: [{ label: "Container", preview: "Container Preview", element: <Element is={Container} padding={20} canvas /> }] },
            { name: "Row", icon: <Minus className="w-4 h-4" />, variants: [{ label: "Row", preview: "[ ═ ║ ═ ║ ═ ]", element: <Element is={Row} canvas /> }] },
            { name: "Column", icon: <Columns className="w-4 h-4" />, variants: [{ label: "Column", preview: "║ Column ║", element: <Element is={Column} canvas /> }] },
            { name: "Grid", icon: <Grid className="w-4 h-4" />, variants: [{ label: "Grid", preview: "Grid Support", element: undefined }] },
            { name: "Spacer", icon: <Maximize className="w-4 h-4" />, variants: [{ label: "Spacer", preview: "Spacing Control", element: undefined }] },
            { name: "Divider", icon: <Minus className="w-4 h-4" />, variants: [{ label: "Divider", preview: "── Divider ──", element: <Divider /> }] },
          ]
        },
        {
          name: "Advanced Layout",
          elements: [
            { name: "Tabs", icon: <Layers className="w-4 h-4" />, variants: [{ label: "Tabs", preview: "Tabs Preview", element: undefined }] },
            { name: "Accordion", icon: <ChevronDown className="w-4 h-4" />, variants: [{ label: "Accordion", preview: "Accordion Preview", element: undefined }] },
            { name: "Card", icon: <Box className="w-4 h-4" />, variants: [{ label: "Card", preview: "Card Preview", element: undefined }] },
            { name: "Modal", icon: <Layers className="w-4 h-4" />, variants: [{ label: "Modal / Popup", preview: "Popup Preview", element: undefined }] },
            { name: "Sidebar", icon: <Columns className="w-4 h-4" />, variants: [{ label: "Sidebar", preview: "Sidebar Preview", element: undefined }] },
            { name: "Navbar", icon: <Layout className="w-4 h-4" />, variants: [{ label: "Navbar", preview: "Navbar Preview", element: undefined }] },
            { name: "Footer", icon: <Layout className="w-4 h-4" />, variants: [{ label: "Footer", preview: "Footer Preview", element: undefined }] },
            { name: "Hero Section", icon: <Briefcase className="w-4 h-4" />, variants: [{ label: "Hero Section", preview: "Hero Preview", element: undefined }] },
          ]
        },
        {
          name: "System",
          elements: [
            {
              name: "New Page",
              icon: <FrameIcon className="w-4 h-4" />,
              variants: [{
                label: "New Page",
                preview: "Page Preview",
                previewBg: "bg-brand-light",
                isNewPage: true,
                dragElement: <Element is={pageComponent} canvas />
              }]
            },
            {
              name: "Frame",
              icon: <FrameIcon className="w-4 h-4" />,
              variants: [{
                label: "Frame",
                preview: "▢ Responsive",
                element: <Element is={Frame} referenceWidth={1440} referenceHeight={900} canvas />
              }]
            }
          ]
        }
      ]
    },
    {
      name: "Content",
      icon: <Type className="w-5 h-5" />,
      subcategories: [
        {
          name: "Basic",
          elements: [
            {
              name: "Text",
              icon: <Type className="w-4 h-4" />,
              variants: [
                {
                  label: "Text",
                  preview: "Aa",
                  element: <Text text="" fontSize={18} width="220px" position="absolute" left="0px" top="0px" />,
                },
              ]
            },
            { name: "Image", icon: <ImageIcon className="w-4 h-4" />, variants: [{ label: "Image", preview: "Image Preview", element: <Image /> }] },
            { name: "Video", icon: <Video className="w-4 h-4" />, variants: [{ label: "Video", preview: "Video Preview", element: undefined }] },
            { name: "Icon", icon: <Star className="w-4 h-4" />, variants: [{ label: "Icon", preview: "Icon Preview", element: undefined }] },
            { name: "Button", icon: <MousePointer2 className="w-4 h-4" />, variants: [{ label: "Button", preview: "Button Preview", element: <Element is={Button} canvas label="Click me" /> }] },
            { name: "Link", icon: <LinkIcon className="w-4 h-4" />, variants: [{ label: "Link", preview: "Link Preview", element: undefined }] },
          ]
        },
        {
          name: "Structured Content",
          elements: [
            { name: "Table", icon: <Table className="w-4 h-4" />, variants: [{ label: "Table", preview: "Table Preview", element: undefined }] },
            { name: "List", icon: <ListIcon className="w-4 h-4" />, variants: [{ label: "List", preview: "List Preview", element: undefined }] },
            { name: "Badge", icon: <Badge className="w-4 h-4" />, variants: [{ label: "Badge / Tag", preview: "Badge Preview", element: undefined }] },
            { name: "Alert", icon: <AlertCircle className="w-4 h-4" />, variants: [{ label: "Alert", preview: "Alert Preview", element: undefined }] },
            { name: "Progress bar", icon: <Sliders className="w-4 h-4" />, variants: [{ label: "Progress bar", preview: "Progress Preview", element: undefined }] },
            { name: "Avatar", icon: <ImageIcon className="w-4 h-4" />, variants: [{ label: "Avatar", preview: "Avatar Preview", element: undefined }] },
          ]
        },
        {
          name: "Media & Embeds",
          elements: [
            { name: "YouTube", icon: <PlayCircle className="w-4 h-4" />, variants: [{ label: "YouTube embed", preview: "YouTube Preview", element: undefined }] },
            { name: "Google Maps", icon: <MapPin className="w-4 h-4" />, variants: [{ label: "Google Maps embed", preview: "Maps Preview", element: undefined }] },
            { name: "iframe", icon: <Code className="w-4 h-4" />, variants: [{ label: "iframe", preview: "iframe Preview", element: undefined }] },
            { name: "Carousel", icon: <ImageIcon className="w-4 h-4" />, variants: [{ label: "Carousel / Slider", preview: "Carousel Preview", element: undefined }] },
          ]
        }
      ]
    },
    {
      name: "Form",
      icon: <CheckSquare className="w-5 h-5" />,
      subcategories: [
        {
          name: "Basic Inputs",
          elements: [
            { name: "Label", icon: <Type className="w-4 h-4" />, variants: [{ label: "Label", preview: "Label Preview", element: undefined }] },
            { name: "Input field", icon: <Sliders className="w-4 h-4" />, variants: [{ label: "Input field", preview: "Input Preview", element: undefined }] },
            { name: "Text area", icon: <Type className="w-4 h-4" />, variants: [{ label: "Text area", preview: "Textarea Preview", element: undefined }] },
            { name: "Checkbox", icon: <CheckSquare className="w-4 h-4" />, variants: [{ label: "Checkbox", preview: "Checkbox Preview", element: undefined }] },
            { name: "Radio", icon: <RadioIcon className="w-4 h-4" />, variants: [{ label: "Radio button", preview: "Radio Preview", element: undefined }] },
            { name: "Dropdown", icon: <ChevronDown className="w-4 h-4" />, variants: [{ label: "Dropdown (select)", preview: "Dropdown Preview", element: undefined }] },
            { name: "Date picker", icon: <Calendar className="w-4 h-4" />, variants: [{ label: "Date picker", preview: "Date Preview", element: undefined }] },
            { name: "Time picker", icon: <Clock className="w-4 h-4" />, variants: [{ label: "Time picker", preview: "Time Preview", element: undefined }] },
            { name: "Slider", icon: <Sliders className="w-4 h-4" />, variants: [{ label: "Slider", preview: "Slider Preview", element: undefined }] },
            { name: "File upload", icon: <Upload className="w-4 h-4" />, variants: [{ label: "File upload", preview: "File Preview", element: undefined }] },
            { name: "Toggle", icon: <ToggleRight className="w-4 h-4" />, variants: [{ label: "Toggle", preview: "Toggle Preview", element: undefined }] },
          ]
        },
        {
          name: "Advanced Inputs",
          elements: [
            { name: "Multi-select", icon: <ChevronDown className="w-4 h-4" />, variants: [{ label: "Multi-select dropdown", preview: "Multi-select Preview", element: undefined }] },
            { name: "Toggle switch", icon: <ToggleRight className="w-4 h-4" />, variants: [{ label: "Toggle switch", preview: "Toggle switch Preview", element: undefined }] },
            { name: "Phone input", icon: <Phone className="w-4 h-4" />, variants: [{ label: "Phone input", preview: "Phone Preview", element: undefined }] },
            { name: "Search input", icon: <Search className="w-4 h-4" />, variants: [{ label: "Search input", preview: "Search Preview", element: undefined }] },
            { name: "OTP input", icon: <Key className="w-4 h-4" />, variants: [{ label: "OTP input", preview: "OTP Preview", element: undefined }] },
            { name: "Rating", icon: <Star className="w-4 h-4" />, variants: [{ label: "Rating (stars)", preview: "Rating Preview", element: undefined }] },
          ]
        },
        {
          name: "Form System",
          elements: [
            { name: "Form wrapper", icon: <Box className="w-4 h-4" />, variants: [{ label: "Form wrapper", preview: "Form wrapper Preview", element: undefined }] },
            { name: "Submit button", icon: <MousePointer2 className="w-4 h-4" />, variants: [{ label: "Submit button", preview: "Submit button Preview", element: undefined }] },
            { name: "Validation", icon: <AlertCircle className="w-4 h-4" />, variants: [{ label: "Validation message", preview: "Validation message Preview", element: undefined }] },
            { name: "Error", icon: <AlertCircle className="w-4 h-4" />, variants: [{ label: "Error message", preview: "Error message Preview", element: undefined }] },
            { name: "Success", icon: <CheckSquare className="w-4 h-4" />, variants: [{ label: "Success message", preview: "Success message Preview", element: undefined }] },
          ]
        }
      ]
    }
  ];

  const ESSENTIALS: (ComponentVariant & { icon: React.ReactNode; color?: string })[] = [
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
    { label: "Image", preview: "Image", element: <Image />, icon: <ImageIcon className="w-5 h-5" />, color: "bg-yellow-500/10" },
    { label: "Button", preview: "Button", element: <Element is={Button} canvas label="Click me" />, icon: <MousePointer2 className="w-5 h-5" />, color: "bg-red-500/10" },
    {
      label: "New Page",
      preview: "New Page",
      isNewPage: true,
      dragElement: <Element is={pageComponent} canvas />,
      icon: <FrameIcon className="w-5 h-5" />,
      color: "bg-brand-light/20"
    },
  ];

  // Global search filtering logic
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    const results: (
      | { type: "element"; item: ComponentElement; cat: Category; sub: Subcategory }
      | { type: "subcategory"; item: Subcategory; cat: Category }
      | { type: "block_group"; item: any }
      | { type: "block_item"; item: AssetItem; group: any }
    )[] = [];

    // Search in UI Elements
    COMPONENTS_DATA.forEach(cat => {
      cat.subcategories.forEach(sub => {
        if (sub.name.toLowerCase().includes(query)) {
          results.push({ type: "subcategory", item: sub, cat });
        }
        sub.elements.forEach(el => {
          if (el.name.toLowerCase().includes(query)) {
            results.push({ type: "element", item: el, cat, sub });
          }
        });
      });
    });

    // Search in Blocks (Assets)
    GROUPED_TEMPLATES.forEach(group => {
      if (group.folder.toLowerCase().includes(query)) {
        results.push({ type: "block_group", item: group });
      }
      group.items.forEach((item: AssetItem) => {
        if (item.label.toLowerCase().includes(query)) {
          results.push({ type: "block_item", item, group });
        }
      });
    });

    return results;
  }, [searchQuery]);

  const renderVariant = (variant: ComponentVariant & { icon?: React.ReactNode; color?: string; name?: string }, compact = false) => {
    const isNewPage = variant.isNewPage;
    return (
      <div
        key={variant.label + (variant.name ?? "")}
        data-drag-source="component"
        data-component-new-page={isNewPage ? "true" : undefined}
        draggable={isNewPage ? true : undefined}
        ref={(ref) => {
          if (!ref) return;
          if (isNewPage) return;
          if (activeTool === "hand") return;
          const sourceElement = variant.dragElement ?? variant.element;
          if (!sourceElement) return;
          connectors.create(ref, withFreePositionDefaults(sourceElement));
        }}
        className={`bg-brand-white/5 rounded-xl hover:bg-brand-white/10 transition-all duration-300 border border-brand-medium/30 group shadow-md ${isNewPage
          ? "cursor-grab active:cursor-grabbing"
          : (variant.dragElement ?? variant.element)
            ? "cursor-move"
            : "cursor-default opacity-50"
          } ${compact ? "p-3 h-22 flex flex-col justify-between" : "p-3 h-full min-h-[100px]"}`}
      >
        {!compact ? (
          <>
            <div
              className={`h-20 ${variant.previewBg ?? "bg-brand-medium/20"} rounded-lg mb-2 border border-dashed border-brand-medium/50 flex items-center justify-center text-[10px] shadow-inner text-center px-2 ${variant.previewBg === "bg-white"
                ? "text-brand-black"
                : "text-brand-lighter"
                }`}
            >
              {variant.preview}
            </div>
            <span className="text-[11px] text-brand-white font-semibold leading-tight line-clamp-2">
              {variant.label}
            </span>
          </>
        ) : (
          <>
            <div className={`w-8 h-8 rounded-lg ${variant.color ?? "bg-brand-medium/20"} flex items-center justify-center text-brand-lighter group-hover:scale-110 transition-transform duration-300`}>
              {variant.icon}
            </div>
            <span className="text-[10px] text-brand-lighter font-medium truncate w-full group-hover:text-brand-white transition-colors">
              {variant.label}
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="relative h-full flex flex-col pt-4">
      {/* Search Bar - Fixed at top of Components tab content */}
      <div className="px-4 pb-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-light/50 group-focus-within:text-brand-lighter transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // If we start searching, we might want to stay in a "searching" state
              // but the absolute views below handle it via opacity/pointer-events
            }}
            placeholder="search in components"
            className="w-full bg-brand-light/10 border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm text-brand-lighter placeholder:text-brand-light/40 focus:outline-none focus:bg-brand-light/15 focus:border-brand-light/30 transition-all shadow-inner uppercase text-[10px] font-bold tracking-widest"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-light/40 hover:text-brand-lighter transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {/* Search Results View */}
        <div
          className={`absolute inset-0 px-4 overflow-y-auto space-y-4 transition-all duration-300 ease-out py-2 z-20 bg-brand-dark no-scrollbar ${searchQuery.trim() ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            }`}
        >
          <div className="flex flex-col gap-1 px-1">
            <span className="text-[10px] font-bold text-brand-medium uppercase tracking-widest">
              Search Results
            </span>
            <span className="text-[9px] text-brand-light opacity-50 uppercase">
              Found {searchResults?.length ?? 0} matches for "{searchQuery}"
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {searchResults?.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-40">
                <Search className="w-8 h-8" />
                <span className="text-xs font-medium">No components found</span>
              </div>
            ) : (
              searchResults?.map((res, idx) => {
                if (res.type === "subcategory" || res.type === "block_group") {
                  const name = res.type === "subcategory" ? res.item.name : res.item.folder;
                  const parentName = res.type === "subcategory" ? res.cat?.name : "Blocks";
                  return (
                    <button
                      key={`search-sub-${idx}`}
                      onClick={() => {
                        if (res.type === "subcategory") {
                          setActiveCategory(res.cat!);
                          setActiveSubcategory(res.item);
                          setPanelView("elements");
                        } else {
                          // For assets, we navigate to the specific folder in AssetsPanel
                          // but since we are in ComponentsPanel hub, we'll just set view to blocks
                          // and we might need to communicate the active folder.
                          // For now, let's just go to the blocks landing.
                          setPanelView("blocks");
                        }
                        setSearchQuery("");
                      }}
                      className="group flex items-center gap-3 bg-brand-white/5 p-3 rounded-xl border border-brand-medium/30 hover:bg-brand-white/10 transition-all font-bold"
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand-dark/50 flex items-center justify-center text-brand-light">
                        <FolderOpen className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm text-brand-white uppercase underline-offset-4 group-hover:underline">{name}</span>
                        <span className="text-[9px] text-brand-medium uppercase tracking-widest">{parentName}</span>
                      </div>
                    </button>
                  );
                }

                if (res.type === "block_item") {
                  const item = res.item;
                  return (
                    <div key={`search-block-${idx}`} className="flex flex-col gap-1.5 mb-2">
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[9px] text-brand-medium font-bold uppercase tracking-widest opacity-60">
                          Block / {res.group.folder}
                        </span>
                      </div>
                      <div
                        data-drag-source="asset"
                        data-asset-category={item.category}
                        data-asset-label={item.label}
                        ref={(ref) => {
                          if (ref && item?.element) connectors.create(ref, item.element);
                        }}
                        className="group bg-brand-white/5 p-3 rounded-xl hover:bg-brand-white/10 transition-all border border-brand-medium/30 cursor-move shadow-sm"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="text-[11px] text-brand-white font-semibold leading-tight line-clamp-2">
                            {item.label}
                          </div>
                          <div className="flex items-center justify-center">
                            <AssetLivePreview
                              item={item}
                              previewMode={res.group.folder.toLowerCase() === "icons" ? "icon" : res.group.folder.toLowerCase() === "shapes" ? "shape" : "full"}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                const el = res.item;
                // If single variant, show as draggable directly in search
                if (el.variants.length === 1) {
                  return (
                    <div key={`search-el-${idx}`} className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[9px] text-brand-medium font-bold uppercase tracking-widest opacity-60">
                          {res.sub?.name}
                        </span>
                      </div>
                      {renderVariant({ ...el.variants[0], icon: el.icon, name: el.name })}
                    </div>
                  );
                }

                // If multiple variants, show element as folder
                return (
                  <button
                    key={`search-el-${idx}`}
                    onClick={() => {
                      setActiveCategory(res.cat!);
                      setActiveSubcategory(res.sub!);
                      setActiveElement(el);
                      setPanelView("variants");
                      setSearchQuery("");
                    }}
                    className="group flex items-center gap-3 bg-brand-white/5 p-3 rounded-xl border border-brand-medium/30 hover:bg-brand-white/10 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-dark/50 flex items-center justify-center text-brand-light">
                      {el.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-brand-white">{el.name}</span>
                      <span className="text-[9px] text-brand-medium font-bold uppercase">{res.sub?.name}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Hub Landing Page */}
        <div
          className={`absolute inset-0 px-4 overflow-y-auto space-y-4 transition-all duration-300 ease-out py-2 flex flex-col ${panelView === "landing" && !searchQuery.trim() ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
            }`}
        >
          {/* Quick Picks - Moved to Hub for faster access */}
          <div className="flex flex-col gap-2 shrink-0">
            <span className="text-[10px] font-bold text-brand-medium uppercase tracking-widest px-1">
              Quick Picks
            </span>
            <div className="grid grid-cols-2 gap-2">
              {ESSENTIALS.map((v) => renderVariant(v, true))}
            </div>
          </div>

          <div className="flex flex-col gap-3 shrink-0">
            <span className="text-[10px] font-bold text-brand-medium uppercase tracking-widest px-1">
              Explore Library
            </span>
            {/* UI ELEMENTS HUB CARD */}
            <button
              onClick={() => setPanelView("categories")}
              className="group relative h-24 bg-brand-white/5 rounded-xl flex flex-col items-center justify-center p-4 border border-brand-medium/30 hover:bg-brand-white/10 transition-all duration-300 hover:border-brand-medium/50 overflow-hidden shadow-sm hover:shadow-md shrink-0"
            >
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Component className="w-12 h-12 -mr-2 -mt-2 rotate-12" />
              </div>
              <div className="flex flex-col items-center relative z-10">
                <span className="text-brand-white text-base font-black tracking-widest uppercase select-none transition-transform group-hover:scale-105 duration-300">
                  UI ELEMENTS
                </span>
                <span className="text-[9px] text-brand-medium font-bold uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">
                  Core Library
                </span>
              </div>
            </button>

            {/* BLOCKS HUB CARD */}
            <button
              onClick={() => setPanelView("blocks")}
              className="group relative h-24 bg-brand-white/5 rounded-xl flex flex-col items-center justify-center p-4 border border-brand-medium/30 hover:bg-brand-white/10 transition-all duration-300 hover:border-brand-medium/50 overflow-hidden shadow-sm hover:shadow-md shrink-0"
            >
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Box className="w-12 h-12 -mr-2 -mt-2 rotate-12" />
              </div>
              <div className="flex flex-col items-center relative z-10">
                <span className="text-brand-white text-base font-black tracking-widest uppercase select-none transition-transform group-hover:scale-105 duration-300">
                  BLOCKS
                </span>
                <span className="text-[9px] text-brand-medium font-bold uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">
                  Pre-built Sections
                </span>
              </div>
            </button>

            {/* TEMPLATES HUB CARD */}
            <button
              onClick={() => setPanelView("templates")}
              className="group relative h-24 bg-brand-white/5 rounded-xl flex flex-col items-center justify-center p-4 border border-brand-medium/30 hover:bg-brand-white/10 transition-all duration-300 hover:border-brand-medium/50 overflow-hidden shadow-sm hover:shadow-md shrink-0"
            >
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <LayoutTemplate className="w-12 h-12 -mr-2 -mt-2 rotate-12" />
              </div>
              <div className="flex flex-col items-center relative z-10">
                <span className="text-brand-white text-base font-black tracking-widest uppercase select-none transition-transform group-hover:scale-105 duration-300">
                  TEMPLATES
                </span>
                <span className="text-[9px] text-brand-medium font-bold uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">
                  Full Page Layouts
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Categories View (UI Elements Categories) */}
        <div
          className={`absolute inset-0 px-4 overflow-y-auto space-y-6 transition-all duration-300 ease-out py-2 pb-20 no-scrollbar ${panelView === "categories" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
            }`}
        >
          <div className="flex items-center gap-2 pb-2 bg-brand-dark sticky top-0 z-10">
            <button
              type="button"
              onClick={() => setPanelView("landing")}
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-light/10 text-brand-light hover:text-white hover:bg-brand-light/20 transition-all border border-white/5 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-black text-brand-lighter uppercase tracking-widest">UI ELEMENTS</span>
          </div>

          <div className="flex flex-col gap-6">
            {COMPONENTS_DATA.map((cat) => (
              <div key={cat.name} className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1 h-3 bg-brand-medium/50 rounded-full" />
                  <span className="text-[10px] font-black text-brand-medium uppercase tracking-[0.25em]">
                    {cat.name}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {cat.subcategories.map((sub) => (
                    <button
                      key={sub.name}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat);
                        setActiveSubcategory(sub);
                        setPanelView("elements");
                      }}
                      className="group relative w-full bg-brand-white/5 rounded-xl border border-brand-medium/30 overflow-hidden hover:bg-brand-white/10 transition-all duration-300 hover:border-brand-medium/50 shadow-sm h-14"
                    >
                      <div className="flex h-full items-center p-2.5 gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand-dark/50 flex items-center justify-center text-brand-light group-hover:text-white transition-colors border border-white/5 shadow-inner shrink-0">
                          {cat.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-[13px] font-semibold text-brand-lighter group-hover:text-brand-white group-hover:translate-x-1 transition-all">{sub.name}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-brand-medium group-hover:text-brand-lighter transition-all group-hover:translate-x-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subcategories View */}
        <div
          className={`absolute inset-0 px-4 overflow-y-auto transition-all duration-300 ease-out py-2 ${panelView === "subcategories" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
            }`}
        >
          <div className="flex items-center gap-2 px-1 pb-2 border-b border-white/10 mb-4 sticky top-0 bg-brand-dark z-10">
            <button
              type="button"
              onClick={() => setPanelView("categories")}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-white/10 text-brand-light hover:text-white hover:bg-white/5 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-bold text-brand-lighter">{activeCategory?.name}</div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {activeCategory?.subcategories.map((sub) => (
              <button
                key={sub.name}
                type="button"
                onClick={() => {
                  setActiveSubcategory(sub);
                  setPanelView("elements");
                }}
                className="group w-full bg-brand-white/5 p-3 rounded-xl hover:bg-brand-white/10 transition-all border border-brand-medium/30 text-left flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-brand-white group-hover:translate-x-1 transition-transform">{sub.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-brand-medium group-hover:text-brand-lighter transition-all group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Elements View */}
        <div
          className={`absolute inset-0 px-4 overflow-y-auto transition-all duration-300 ease-out py-2 ${panelView === "elements" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
            }`}
        >
          <div className="flex items-center gap-2 px-1 pb-2 border-b border-white/10 mb-4 sticky top-0 bg-brand-dark z-10">
            <button
              type="button"
              onClick={() => setPanelView("categories")}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-white/10 text-brand-light hover:text-white hover:bg-white/5 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-[10px] font-bold text-brand-light/70 truncate">
              {activeCategory?.name} <span className="mx-0.5 opacity-30">/</span> {activeSubcategory?.name}
            </div>
          </div>

          <div className={`grid gap-3 ${activeSubcategory?.elements.every(el => el.variants.length === 1) ? "grid-cols-2" : "grid-cols-1"}`}>
            {activeSubcategory?.elements.map((el) => {
              // If element has only ONE variant, show that variant directly (no folder)
              if (el.variants.length === 1) {
                return renderVariant({
                  ...el.variants[0],
                  icon: el.icon,
                  name: el.name
                }, activeSubcategory.elements.length > 4); // Use compact mode if many items
              }

              // Otherwise, show as a folder button
              return (
                <button
                  key={el.name}
                  onClick={() => {
                    setActiveElement(el);
                    setPanelView("variants");
                  }}
                  className="group w-full bg-brand-white/5 p-3 rounded-xl hover:bg-brand-white/10 transition-all border border-brand-medium/30 text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-dark/50 flex items-center justify-center text-brand-light group-hover:text-white transition-colors border border-white/5 shadow-inner shrink-0">
                      {el.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold text-brand-white group-hover:translate-x-1 transition-transform">{el.name}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-brand-medium group-hover:text-brand-lighter transition-all group-hover:translate-x-1" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Variants View */}
        <div
          className={`absolute inset-0 px-4 overflow-y-auto transition-all duration-300 ease-out py-2 ${panelView === "variants" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
            }`}
        >
          <div className="flex items-center gap-2 px-1 pb-2 border-b border-white/10 mb-4 sticky top-0 bg-brand-dark z-10">
            <button
              type="button"
              onClick={() => setPanelView("elements")}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-white/10 text-brand-light hover:text-white hover:bg-white/5 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-[10px] font-bold text-brand-light/70 truncate">
              {activeCategory?.name} <span className="mx-0.5 opacity-30">/</span> {activeElement?.name}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {activeElement?.variants.map((v) => renderVariant(v))}
          </div>
        </div>

        {/* Blocks View (AssetsPanel) */}
        <div
          className={`absolute inset-0 transition-all duration-300 ease-out ${panelView === "blocks" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
            }`}
        >
          <div className="h-full flex flex-col p-4 pt-0">
            <div className="flex items-center gap-2 pb-4 bg-brand-dark sticky top-0 z-10">
              <button
                type="button"
                onClick={() => setPanelView("landing")}
                className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-light/10 text-brand-light hover:text-white hover:bg-brand-light/20 transition-all border border-white/5 shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-black text-brand-lighter uppercase tracking-widest">BLOCKS</span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <AssetsPanel />
            </div>
          </div>
        </div>

        {/* Templates View (TemplatePanel) */}
        <div
          className={`absolute inset-0 transition-all duration-300 ease-out ${panelView === "templates" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
            }`}
        >
          <div className="h-full flex flex-col p-4 pt-0">
            <div className="flex items-center gap-2 pb-4 bg-brand-dark sticky top-0 z-10">
              <button
                type="button"
                onClick={() => setPanelView("landing")}
                className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-light/10 text-brand-light hover:text-white hover:bg-brand-light/20 transition-all border border-white/5 shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-black text-brand-lighter uppercase tracking-widest">TEMPLATES</span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <TemplatePanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



import React, { useState } from "react";
import { useEditor, Element } from "@craftjs/core";
import { ChevronLeft, ChevronRight, Layout, Type, MousePointer2, Box, Layers, Columns, Grid, Maximize, Minus, BookOpen, Briefcase, Frame as FrameIcon, Image as ImageIcon, Video, Star, Link as LinkIcon, Table, List as ListIcon, Badge, AlertCircle, PlayCircle, Mail, MapPin, Code, Sliders, CheckSquare, Circle as RadioIcon, Calendar, Clock, Upload, ToggleRight, Phone, Search, Key, ChevronDown } from "lucide-react";
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
  const [panelView, setPanelView] = useState<"categories" | "subcategories" | "elements" | "variants">("categories");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<Subcategory | null>(null);
  const [activeElement, setActiveElement] = useState<ComponentElement | null>(null);

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
    });
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

  const renderVariant = (variant: ComponentVariant & { icon?: React.ReactNode; color?: string }, compact = false) => {
    const isNewPage = variant.isNewPage;
    return (
      <div
        key={variant.label}
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
          } ${compact ? "p-3 h-22 flex flex-col justify-between" : "p-3 h-full"}`}
      >
        {!compact ? (
          <>
            <div
              className={`h-20 ${variant.previewBg ?? "bg-brand-medium/20"} rounded-lg mb-2 border border-dashed border-brand-medium/50 flex items-center justify-center text-xs shadow-inner ${variant.previewBg === "bg-white"
                ? "text-brand-black"
                : "text-brand-lighter"
                }`}
            >
              {variant.preview}
            </div>
            <span className="text-xs text-brand-white font-semibold">
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
    <div className="relative h-full flex flex-col p-1">
      <div className="relative flex-1 overflow-hidden">
        {/* Categories View */}
        <div
          className={`absolute inset-0 overflow-y-auto space-y-4 transition-transform duration-250 ease-out py-2 ${panelView === "categories" ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          {/* Essentials Quick Access */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-brand-medium uppercase tracking-widest px-1">
              Quick Picks
            </span>
            <div className="grid grid-cols-2 gap-2">
              {ESSENTIALS.map((v) => renderVariant(v, true))}
            </div>
          </div>

          {/* Full Library Folders */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-brand-medium uppercase tracking-widest px-1">
              Component Library
            </span>
            <div className="grid grid-cols-1 gap-2">
              {COMPONENTS_DATA.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat);
                    setPanelView("subcategories");
                  }}
                  className="group relative w-full bg-brand-white/5 rounded-xl border border-brand-medium/30 overflow-hidden hover:bg-brand-white/10 transition-all duration-300 hover:border-brand-medium/50 shadow-sm h-16"
                >
                  <div className="flex h-full items-center p-2.5 gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-dark/50 flex items-center justify-center text-brand-light group-hover:text-white transition-colors border border-white/5 shadow-inner shrink-0">
                      {cat.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold text-brand-white group-hover:translate-x-1 transition-transform">{cat.name}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-brand-medium group-hover:text-brand-lighter transition-all group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subcategories View */}
        <div
          className={`absolute inset-0 transition-transform duration-250 ease-out py-2 ${panelView === "subcategories" ? "translate-x-0" : activeCategory ? "translate-x-full" : "-translate-x-full"
            }`}
        >
          <div className="h-full overflow-y-auto">
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
        </div>

        {/* Elements View */}
        <div
          className={`absolute inset-0 transition-transform duration-250 ease-out py-2 ${panelView === "elements" ? "translate-x-0" : "translate-x-full"
            }`}
        >
          <div className="h-full overflow-y-auto">
            <div className="flex items-center gap-2 px-1 pb-2 border-b border-white/10 mb-4 sticky top-0 bg-brand-dark z-10">
              <button
                type="button"
                onClick={() => setPanelView("subcategories")}
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-white/10 text-brand-light hover:text-white hover:bg-white/5 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-[10px] font-bold text-brand-light/70 truncate">
                {activeCategory?.name} <span className="mx-0.5 opacity-30">/</span> {activeSubcategory?.name}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {activeSubcategory?.elements.map((el) => (
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
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-brand-white group-hover:translate-x-1 transition-transform">{el.name}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-brand-medium group-hover:text-brand-lighter transition-all group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Variants View */}
        <div
          className={`absolute inset-0 transition-transform duration-250 ease-out py-2 ${panelView === "variants" ? "translate-x-0" : "translate-x-full"
            }`}
        >
          <div className="h-full overflow-y-auto">
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
        </div>
      </div>
    </div>
  );
};



import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { PositionGroup } from "../../_components/rightPanel/settings/PositionGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import { ColorPicker } from "../../_components/rightPanel/settings/inputs/ColorPicker";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { TabsProps, SetProp, TabItem } from "../../_types/components";

const generateId = () => Math.random().toString(36).substring(2, 9);

export const TabsSettings = () => {
  const {
    tabs,
    activeTabId,
    tabHeaderBackgroundColor,
    tabHeaderTextColor,
    activeTabBackgroundColor,
    activeTabTextColor,
    tabAlignment,
    background,
    paddingLeft, paddingRight, paddingTop, paddingBottom,
    marginLeft, marginRight, marginTop, marginBottom,
    width, height,
    backgroundImage, backgroundSize, backgroundPosition, backgroundRepeat, backgroundOverlay,
    borderRadius, radiusTopLeft, radiusTopRight, radiusBottomRight, radiusBottomLeft,
    borderColor, borderWidth, borderStyle, strokePlacement,
    position, display, zIndex, top, right, bottom, left, editorVisibility,
    boxShadow, opacity, overflow, cursor,
    actions: { setProp }
  } = useNode(node => ({
    tabs: node.data.props.tabs || [],
    activeTabId: node.data.props.activeTabId,
    tabHeaderBackgroundColor: node.data.props.tabHeaderBackgroundColor,
    tabHeaderTextColor: node.data.props.tabHeaderTextColor,
    activeTabBackgroundColor: node.data.props.activeTabBackgroundColor,
    activeTabTextColor: node.data.props.activeTabTextColor,
    tabAlignment: node.data.props.tabAlignment,
    background: node.data.props.background,
    paddingLeft: node.data.props.paddingLeft,
    paddingRight: node.data.props.paddingRight,
    paddingTop: node.data.props.paddingTop,
    paddingBottom: node.data.props.paddingBottom,
    marginLeft: node.data.props.marginLeft,
    marginRight: node.data.props.marginRight,
    marginTop: node.data.props.marginTop,
    marginBottom: node.data.props.marginBottom,
    width: node.data.props.width,
    height: node.data.props.height,
    backgroundImage: node.data.props.backgroundImage,
    backgroundSize: node.data.props.backgroundSize,
    backgroundPosition: node.data.props.backgroundPosition,
    backgroundRepeat: node.data.props.backgroundRepeat,
    backgroundOverlay: node.data.props.backgroundOverlay,
    borderRadius: node.data.props.borderRadius,
    radiusTopLeft: node.data.props.radiusTopLeft,
    radiusTopRight: node.data.props.radiusTopRight,
    radiusBottomRight: node.data.props.radiusBottomRight,
    radiusBottomLeft: node.data.props.radiusBottomLeft,
    borderColor: node.data.props.borderColor,
    borderWidth: node.data.props.borderWidth,
    borderStyle: node.data.props.borderStyle,
    strokePlacement: node.data.props.strokePlacement,
    position: node.data.props.position,
    display: node.data.props.display,
    zIndex: node.data.props.zIndex,
    top: node.data.props.top,
    right: node.data.props.right,
    bottom: node.data.props.bottom,
    left: node.data.props.left,
    editorVisibility: node.data.props.editorVisibility,
    boxShadow: node.data.props.boxShadow,
    opacity: node.data.props.opacity,
    overflow: node.data.props.overflow,
    cursor: node.data.props.cursor,
  }));

  const typedSetProp = setProp as SetProp<TabsProps>;

  const handleAddTab = () => {
    typedSetProp(props => {
      const newTabId = `tab-${generateId()}`;
      props.tabs = [...props.tabs, { id: newTabId, title: "New Tab", content: `tab-content-${newTabId}` }];
      props.activeTabId = newTabId;
    });
  };

  const handleRemoveTab = (idToRemove: string) => {
    if (tabs.length <= 1) return;

    typedSetProp(props => {
      props.tabs = props.tabs.filter(t => t.id !== idToRemove);
      if (props.activeTabId === idToRemove) {
        props.activeTabId = props.tabs[0].id;
      }
    });
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    typedSetProp(props => {
      const idx = props.tabs.findIndex(t => t.id === id);
      if (idx !== -1) {
        props.tabs[idx].title = newTitle;
      }
    });
  };

  const handleContentChange = (id: string, newContent: React.ReactNode | string) => {
    typedSetProp(props => {
      const idx = props.tabs.findIndex(t => t.id === id);
      if (idx !== -1) {
        props.tabs[idx].content = typeof newContent === 'string' ? newContent : String(newContent);
      }
    });
  };

  return (
    <div className="flex flex-col pb-4">
      {/* Tab Configuration Section */}
      <DesignSection title="Tab Configuration" defaultOpen={true}>
        <div className="flex flex-col gap-4 py-2">
          
          <div className="flex flex-col gap-2">
            <span className="text-[12px] text-[var(--builder-text)] font-base uppercase tracking-wider opacity-60">Manage Tabs</span>
            
            <div className="flex flex-col gap-2">
              {tabs.map((tab: TabItem) => (
                <div key={tab.id} className="flex flex-col bg-[var(--builder-surface-2)]/30 rounded-lg overflow-hidden border border-[var(--builder-border)]">
                  <div 
                    className={`flex flex-row items-center gap-2 p-2 cursor-pointer transition-colors ${
                      activeTabId === tab.id ? 'bg-[var(--builder-surface-2)]' : 'hover:bg-[var(--builder-surface-2)]'
                    }`}
                    onClick={() => typedSetProp(p => { p.activeTabId = tab.id; })}
                  >
                    <input
                      type="text"
                      value={tab.title}
                      onChange={(e) => handleTitleChange(tab.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className={`flex-1 text-xs bg-transparent border-none outline-none text-[var(--builder-text)] font-medium placeholder:text-[var(--builder-text-faint)]`}
                      placeholder="Tab Title"
                    />
                    
                    {/* Expand/Collapse Toggle Indicator */}
                    <div className="text-[var(--builder-text-faint)]">
                      {activeTabId === tab.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>

                    {/* Remove Tab Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveTab(tab.id); }}
                      disabled={tabs.length <= 1}
                      className="p-1.5 text-[var(--builder-text-faint)] hover:text-red-400 rounded transition-colors disabled:opacity-30 disabled:hover:text-[var(--builder-text-faint)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {activeTabId === tab.id && (
                    <div className="p-3 bg-[var(--builder-surface-2)] border-t border-[var(--builder-border)] flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <span className="text-[10px] font-bold text-[var(--builder-text-faint)] uppercase tracking-wider italic opacity-70">
                        Drag components into the tab content on the canvas
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <button
              onClick={handleAddTab}
              className="mt-1 w-full py-2 bg-transparent text-[var(--builder-text)] text-xs font-medium rounded-lg border border-[var(--builder-border)] hover:border-[var(--builder-border-mid)] hover:bg-[var(--builder-surface-2)] transition-all flex items-center justify-center gap-2 group"
            >
              <Plus size={14} className="group-hover:scale-110 transition-transform" />
              Add Tab
            </button>
          </div>

          <div className="h-px bg-[var(--builder-border)] w-full" />

          {/* Tab Alignment Section */}
          <div className="flex flex-col gap-2">
            <span className="text-[12px] text-[var(--builder-text)] font-base uppercase tracking-wider opacity-60">Tab Alignment</span>
            <div className="flex flex-row p-1 bg-[var(--builder-surface-2)]/30 rounded-lg border border-[var(--builder-border)]">
              <button
                onClick={() => typedSetProp(p => { p.tabAlignment = "left"; })}
                className={`flex-1 py-1.5 text-[10px] font-bold uppercase transition-all rounded ${
                  (tabAlignment === "left" || !tabAlignment) ? 'bg-[var(--builder-accent)] text-black shadow-sm' : 'text-[var(--builder-text-faint)] hover:text-[var(--builder-text-muted)]'
                }`}
              >
                Left
              </button>
              <button
                onClick={() => typedSetProp(p => { p.tabAlignment = "center"; })}
                className={`flex-1 py-1.5 text-[10px] font-bold uppercase transition-all rounded ${
                  tabAlignment === "center" ? 'bg-[var(--builder-accent)] text-black shadow-sm' : 'text-[var(--builder-text-faint)] hover:text-[var(--builder-text-muted)]'
                }`}
              >
                Center
              </button>
              <button
                onClick={() => typedSetProp(p => { p.tabAlignment = "right"; })}
                className={`flex-1 py-1.5 text-[10px] font-bold uppercase transition-all rounded ${
                  tabAlignment === "right" ? 'bg-[var(--builder-accent)] text-black shadow-sm' : 'text-[var(--builder-text-faint)] hover:text-[var(--builder-text-muted)]'
                }`}
              >
                Right
              </button>
            </div>
          </div>

          <div className="h-px bg-[var(--builder-border)] w-full" />

          <div className="flex flex-col gap-4">
            <span className="text-[12px] text-[var(--builder-text)] font-base uppercase tracking-wider opacity-60">Tab Colors</span>
            
            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-[var(--builder-text)] font-base">Inactive Tab Background</label>
              <ColorPicker
                value={tabHeaderBackgroundColor || "transparent"}
                onChange={(val) => typedSetProp(p => { p.tabHeaderBackgroundColor = val; })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-[var(--builder-text)] font-base">Inactive Tab Text</label>
              <ColorPicker
                value={tabHeaderTextColor || "#000000"}
                onChange={(val) => typedSetProp(p => { p.tabHeaderTextColor = val; })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-[var(--builder-text)] font-base">Active Tab Background</label>
              <ColorPicker
                value={activeTabBackgroundColor || "#ffffff"}
                onChange={(val) => typedSetProp(p => { p.activeTabBackgroundColor = val; })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-[var(--builder-text)] font-base">Active Tab Text</label>
              <ColorPicker
                value={activeTabTextColor || "#000000"}
                onChange={(val) => typedSetProp(p => { p.activeTabTextColor = val; })}
              />
            </div>
          </div>

        </div>
      </DesignSection>

      <DesignSection title="Layout & Layer" defaultOpen={false}>
        <PositionGroup
          position={position}
          display={display}
          zIndex={zIndex}
          top={top}
          right={right}
          bottom={bottom}
          left={left}
          editorVisibility={editorVisibility}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Size & Spacing">
        <SizePositionGroup
          width={width}
          height={height}
          paddingLeft={paddingLeft}
          paddingRight={paddingRight}
          paddingTop={paddingTop}
          paddingBottom={paddingBottom}
          marginLeft={marginLeft}
          marginRight={marginRight}
          marginTop={marginTop}
          marginBottom={marginBottom}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Appearance">
        <AppearanceGroup
          background={background}
          backgroundImage={backgroundImage}
          backgroundSize={backgroundSize}
          backgroundPosition={backgroundPosition}
          backgroundRepeat={backgroundRepeat}
          backgroundOverlay={backgroundOverlay}
          borderColor={borderColor}
          borderWidth={borderWidth}
          borderStyle={borderStyle}
          strokePlacement={strokePlacement}
          radiusTopLeft={radiusTopLeft}
          radiusTopRight={radiusTopRight}
          radiusBottomRight={radiusBottomRight}
          radiusBottomLeft={radiusBottomLeft}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Effects" defaultOpen={false}>
        <EffectsGroup
          opacity={opacity}
          boxShadow={boxShadow}
          overflow={overflow}
          cursor={cursor}
          setProp={typedSetProp}
        />
      </DesignSection>

    </div>
  );
};

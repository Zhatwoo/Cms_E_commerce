/* eslint-disable */
import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { LayoutLayerGroup } from "../../_components/rightPanel/settings/LayoutLayerGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import { ColorPicker } from "../../_components/rightPanel/settings/inputs/ColorPicker";
import type { AccordionItem, AccordionOption, AccordionProps } from "../../_types/components";
import type { InteractionAction, InteractionTrigger, TransitionType } from "../../_types/prototype";
import { Link2, Plus, Trash2 } from "lucide-react";

const TRIGGER_OPTIONS: Array<{ value: InteractionTrigger; label: string }> = [
  { value: "click", label: "On click" },
  { value: "doubleClick", label: "On double click" },
  { value: "hover", label: "On hover" },
  { value: "mouseLeave", label: "On mouse leave" },
];

const ACTION_OPTIONS: Array<{ value: InteractionAction; label: string }> = [
  { value: "navigateTo", label: "Navigate to" },
  { value: "openUrl", label: "Open URL" },
  { value: "scrollTo", label: "Scroll to" },
  { value: "back", label: "Back" },
  { value: "openOverlay", label: "Open overlay" },
  { value: "closeOverlay", label: "Close overlay" },
];

const TRANSITION_OPTIONS: Array<{ value: TransitionType; label: string }> = [
  { value: "instant", label: "Instant" },
  { value: "dissolve", label: "Dissolve" },
  { value: "slideLeft", label: "Slide left" },
  { value: "slideRight", label: "Slide right" },
  { value: "slideUp", label: "Slide up" },
  { value: "slideDown", label: "Slide down" },
  { value: "push", label: "Push" },
  { value: "moveIn", label: "Move in" },
];

function normalizeOption(option: string | AccordionOption | undefined, index: number): AccordionOption {
  if (typeof option === "string") {
    return { label: option.trim() || `Option ${index + 1}` };
  }

  const label = typeof option?.label === "string" && option.label.trim() ? option.label.trim() : `Option ${index + 1}`;
  return {
    label,
    interactions: Array.isArray(option?.interactions) ? option.interactions : [],
  };
}

function normalizeItems(items: AccordionItem[] | undefined): AccordionItem[] {
  return (Array.isArray(items) ? items : []).map((item, index) => {
    const header = typeof item?.header === "string" && item.header.trim()
      ? item.header.trim()
      : (typeof item?.title === "string" && item.title.trim() ? item.title.trim() : `Dropdown ${index + 1}`);

    const legacyOptions = Array.isArray(item?.options)
      ? item.options
      : typeof item?.content === "string"
        ? item.content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
        : [];

    const options = legacyOptions.length > 0
      ? legacyOptions.map((option, optionIndex) => normalizeOption(option, optionIndex))
      : [{ label: "Option 1" }];

    return { header, options };
  });
}

export const AccordionSettings = () => {
  const {
    id,
    items,
    stylePreset,
    editorPreviewMode,
    allowMultiple,
    allowCollapseAll,
    defaultOpenIndex,
    animationDurationMs,
    width,
    height,
    maxWidth,
    minHeight,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    position,
    display,
    alignSelf,
    zIndex,
    top,
    right,
    bottom,
    left,
    isFreeform,
    editorVisibility,
    borderRadius,
    backgroundColor,
    borderColor,
    borderWidth,
    iconColor,
    iconPosition,
    headerGap,
    headerPaddingX,
    headerPaddingY,
    textOffsetX,
    textOffsetY,
    iconOffsetX,
    iconOffsetY,
    headerTextColor,
    headerFontSize,
    headerFontWeight,
    headerFontStyle,
    headerLetterSpacing,
    headerLineHeight,
    headerTextAlign,
    headerTextTransform,
    headerTextDecoration,
    contentTextColor,
    contentFontSize,
    fontFamily,
    actions: { setProp },
  } = useNode((node) => ({
    items: node.data.props.items as AccordionItem[],
    stylePreset: node.data.props.stylePreset as "classic" | "wix" | undefined,
    editorPreviewMode: node.data.props.editorPreviewMode as "normal" | "expand-all" | "collapse-all" | undefined,
    allowMultiple: node.data.props.allowMultiple as boolean,
    allowCollapseAll: node.data.props.allowCollapseAll as boolean,
    defaultOpenIndex: node.data.props.defaultOpenIndex as number,
    animationDurationMs: node.data.props.animationDurationMs as number,
    width: node.data.props.width as string,
    height: node.data.props.height as string,
    maxWidth: node.data.props.maxWidth as string,
    minHeight: node.data.props.minHeight as number,
    marginTop: node.data.props.marginTop as number,
    marginRight: node.data.props.marginRight as number,
    marginBottom: node.data.props.marginBottom as number,
    marginLeft: node.data.props.marginLeft as number,
    position: node.data.props.position as AccordionProps["position"],
    display: node.data.props.display as AccordionProps["display"],
    alignSelf: node.data.props.alignSelf as AccordionProps["alignSelf"],
    zIndex: node.data.props.zIndex as number,
    top: node.data.props.top as string,
    right: node.data.props.right as string,
    bottom: node.data.props.bottom as string,
    left: node.data.props.left as string,
    isFreeform: node.data.props.isFreeform as boolean,
    editorVisibility: node.data.props.editorVisibility as AccordionProps["editorVisibility"],
    borderRadius: node.data.props.borderRadius as number,
    backgroundColor: node.data.props.backgroundColor as string,
    borderColor: node.data.props.borderColor as string,
    borderWidth: node.data.props.borderWidth as number,
    iconColor: node.data.props.iconColor as string,
    iconPosition: node.data.props.iconPosition as "left" | "right" | undefined,
    headerGap: node.data.props.headerGap as number,
    headerPaddingX: node.data.props.headerPaddingX as number,
    headerPaddingY: node.data.props.headerPaddingY as number,
    textOffsetX: node.data.props.textOffsetX as number,
    textOffsetY: node.data.props.textOffsetY as number,
    iconOffsetX: node.data.props.iconOffsetX as number,
    iconOffsetY: node.data.props.iconOffsetY as number,
    headerTextColor: node.data.props.headerTextColor as string,
    headerFontSize: node.data.props.headerFontSize as number,
    headerFontWeight: node.data.props.headerFontWeight as string,
    headerFontStyle: node.data.props.headerFontStyle as string,
    headerLetterSpacing: node.data.props.headerLetterSpacing as string | number,
    headerLineHeight: node.data.props.headerLineHeight as string | number,
    headerTextAlign: node.data.props.headerTextAlign as any,
    headerTextTransform: node.data.props.headerTextTransform as any,
    headerTextDecoration: node.data.props.headerTextDecoration as string,
    contentTextColor: node.data.props.contentTextColor as string,
    contentFontSize: node.data.props.contentFontSize as number,
    fontFamily: node.data.props.fontFamily as string,
  }));

  const safeItems = normalizeItems(items);

  const saveItems = (nextItems: AccordionItem[]) => {
    setProp((props: AccordionProps) => {
      props.items = nextItems;
    });
  };

  const makeDefaultInteraction = () => ({
    trigger: "click" as InteractionTrigger,
    action: "navigateTo" as InteractionAction,
    destination: "",
    duration: 300,
    easing: "ease",
    transition: "dissolve" as TransitionType,
  });

  const updateHeader = (itemIndex: number, value: string) => {
    const next = [...safeItems];
    const current = next[itemIndex];
    if (!current) return;
    next[itemIndex] = { ...current, header: value };
    saveItems(next);
  };

  const updateOption = (itemIndex: number, optionIndex: number, value: string) => {
    const next = [...safeItems];
    const current = next[itemIndex];
    const option = current?.options?.[optionIndex];
    if (!current || !option) return;
    const options = [...current.options];
    options[optionIndex] = { ...option, label: value };
    next[itemIndex] = { ...current, options };
    saveItems(next);
  };

  const addItem = () => {
    saveItems([...safeItems, { header: `Dropdown ${safeItems.length + 1}`, options: [{ label: "Option 1" }] }]);
  };

  const removeItem = (itemIndex: number) => {
    saveItems(safeItems.filter((_, index) => index !== itemIndex));
  };

  const addOption = (itemIndex: number) => {
    const next = [...safeItems];
    const current = next[itemIndex];
    if (!current) return;
    next[itemIndex] = {
      ...current,
      options: [...current.options, { label: `Option ${current.options.length + 1}` }],
    };
    saveItems(next);
  };

  const removeOption = (itemIndex: number, optionIndex: number) => {
    const next = [...safeItems];
    const current = next[itemIndex];
    if (!current) return;
    next[itemIndex] = {
      ...current,
      options: current.options.filter((_, index) => index !== optionIndex),
    };
    saveItems(next);
  };

  const addOptionInteraction = (itemIndex: number, optionIndex: number) => {
    const next = [...safeItems];
    const current = next[itemIndex];
    const option = current?.options?.[optionIndex];
    if (!current || !option) return;
    const options = [...current.options];
    options[optionIndex] = { ...option, interactions: [...(option.interactions ?? []), makeDefaultInteraction()] };
    next[itemIndex] = { ...current, options };
    saveItems(next);
  };

  const updateOptionInteraction = (
    itemIndex: number,
    optionIndex: number,
    interactionIndex: number,
    key: string,
    value: string | number
  ) => {
    const next = [...safeItems];
    const current = next[itemIndex];
    const option = current?.options?.[optionIndex];
    const interaction = option?.interactions?.[interactionIndex];
    if (!current || !option || !interaction) return;
    const interactions = [...(option.interactions ?? [])];
    interactions[interactionIndex] = { ...interaction, [key]: value };
    const options = [...current.options];
    options[optionIndex] = { ...option, interactions };
    next[itemIndex] = { ...current, options };
    saveItems(next);
  };

  const removeOptionInteraction = (itemIndex: number, optionIndex: number, interactionIndex: number) => {
    const next = [...safeItems];
    const current = next[itemIndex];
    const option = current?.options?.[optionIndex];
    if (!current || !option) return;
    const options = [...current.options];
    options[optionIndex] = {
      ...option,
      interactions: (option.interactions ?? []).filter((_, index) => index !== interactionIndex),
    };
    next[itemIndex] = { ...current, options };
    saveItems(next);
  };

  return (
    <div className="flex flex-col pb-4 gap-4">
      <DesignSection title="Header & Options" defaultOpen>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Canvas Preview</label>
              <div className="grid grid-cols-2 gap-1 bg-[var(--builder-surface-2)] p-1 rounded-lg border border-[var(--builder-border)]">
                <button type="button" title="Preview all accordion items expanded" onClick={() => setProp((props: AccordionProps) => { props.editorPreviewMode = "expand-all"; })} className={`text-[10px] py-1.5 rounded transition-colors ${editorPreviewMode === "expand-all" ? "bg-[var(--builder-accent)] text-black" : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"}`}>
                  Expand
                </button>
                  <button type="button" title="Preview all accordion items collapsed" onClick={() => setProp((props: AccordionProps) => { props.editorPreviewMode = "collapse-all"; })} className={`text-[10px] py-1.5 rounded transition-colors ${editorPreviewMode === "collapse-all" ? "bg-[var(--builder-accent)] text-black" : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"}`}>
                  Collapse
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Style Preset</label>
              <select
                title="Accordion style preset"
                value={stylePreset ?? "wix"}
                onChange={(event) => setProp((props: AccordionProps) => { props.stylePreset = event.target.value as "classic" | "wix"; })}
                className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none"
              >
                <option value="wix">Wix</option>
                <option value="classic">Classic</option>
              </select>
            </div>
          </div>

          {safeItems.map((item, itemIndex) => (
            <div key={itemIndex} className="flex flex-col gap-3 bg-[var(--builder-surface-2)] rounded-xl p-3 border border-[var(--builder-border)]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--builder-text-faint)]">Dropdown {itemIndex + 1}</span>
                {safeItems.length > 1 && (
                  <button type="button" title={`Remove dropdown ${itemIndex + 1}`} onClick={() => removeItem(itemIndex)} className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[var(--builder-text)]">Header text</label>
                <input
                  type="text"
                  title="Dropdown header text"
                  placeholder="Dropdown header"
                  value={item.header}
                  onChange={(event) => updateHeader(itemIndex, event.target.value)}
                  className="w-full bg-[var(--builder-surface-1)] border border-[var(--builder-border)] rounded-lg text-xs text-[var(--builder-text)] p-2 focus:outline-none focus:border-[var(--builder-accent)]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[var(--builder-text)] font-medium">Options</span>
                  <button type="button" title={`Add option to dropdown ${itemIndex + 1}`} onClick={() => addOption(itemIndex)} className="inline-flex items-center gap-1 rounded-md border border-[var(--builder-border)] bg-[var(--builder-surface-1)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)] transition-colors">
                    <Plus className="w-3 h-3" />
                    Option
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {item.options.map((option, optionIndex) => (
                    <div key={`${itemIndex}-${optionIndex}`} className="rounded-lg border border-[var(--builder-border)] bg-[var(--builder-surface-1)] p-2 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] text-[var(--builder-text)]">Option {optionIndex + 1}</label>
                        {item.options.length > 1 && (
                          <button type="button" onClick={() => removeOption(itemIndex, optionIndex)} className="text-[10px] text-red-300 hover:text-red-200">
                            Remove
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                          title={`Option ${optionIndex + 1} label`}
                          placeholder="Option label"
                        value={option.label}
                        onChange={(event) => updateOption(itemIndex, optionIndex, event.target.value)}
                        className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-[var(--builder-accent)]"
                      />

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--builder-border)]/60">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--builder-text-faint)]">Interactions</span>
                        <button type="button" title={`Add interaction to option ${optionIndex + 1}`} onClick={() => addOptionInteraction(itemIndex, optionIndex)} className="inline-flex items-center gap-1 rounded-md border border-[var(--builder-border)] bg-[var(--builder-surface-1)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)] transition-colors">
                          <Link2 className="w-3 h-3" />
                          Add
                        </button>
                      </div>

                      {(option.interactions ?? []).length === 0 ? (
                        <p className="text-[10px] text-[var(--builder-text-faint)]">No interaction yet. Add one to make this option clickable.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {(option.interactions ?? []).map((interaction, interactionIndex) => (
                            <div key={interactionIndex} className="rounded-lg border border-[var(--builder-border)] bg-[var(--builder-surface-1)] p-2 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] uppercase tracking-widest text-[var(--builder-text-faint)]">Action {interactionIndex + 1}</span>
                                <button type="button" title={`Remove interaction ${interactionIndex + 1}`} onClick={() => removeOptionInteraction(itemIndex, optionIndex, interactionIndex)} className="text-[10px] text-red-300 hover:text-red-200">
                                  Remove
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] text-[var(--builder-text)]">Trigger</label>
                                  <select
                                    title="Interaction trigger"
                                    value={interaction.trigger}
                                    onChange={(event) => updateOptionInteraction(itemIndex, optionIndex, interactionIndex, "trigger", event.target.value)}
                                    className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none"
                                  >
                                    {TRIGGER_OPTIONS.map((triggerOption) => (
                                      <option key={triggerOption.value} value={triggerOption.value}>{triggerOption.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] text-[var(--builder-text)]">Action</label>
                                  <select
                                    title="Interaction action"
                                    value={interaction.action}
                                    onChange={(event) => updateOptionInteraction(itemIndex, optionIndex, interactionIndex, "action", event.target.value)}
                                    className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none"
                                  >
                                    {ACTION_OPTIONS.map((actionOption) => (
                                      <option key={actionOption.value} value={actionOption.value}>{actionOption.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-[var(--builder-text)]">Destination</label>
                                <input
                                  type="text"
                                  title="Interaction destination"
                                  placeholder="page slug, #section, or https://..."
                                  value={interaction.destination ?? ""}
                                  onChange={(event) => updateOptionInteraction(itemIndex, optionIndex, interactionIndex, "destination", event.target.value)}
                                  className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-[var(--builder-accent)]"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] text-[var(--builder-text)]">Duration</label>
                                    <NumericInput
                                    value={interaction.duration ?? 300}
                                    min={0}
                                    max={3000}
                                    unit="ms"
                                    onChange={(value) => updateOptionInteraction(itemIndex, optionIndex, interactionIndex, "duration", value)}
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] text-[var(--builder-text)]">Transition</label>
                                  <select
                                    title="Interaction transition"
                                    value={interaction.transition ?? "dissolve"}
                                    onChange={(event) => updateOptionInteraction(itemIndex, optionIndex, interactionIndex, "transition", event.target.value)}
                                    className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none"
                                  >
                                    {TRANSITION_OPTIONS.map((transitionOption) => (
                                      <option key={transitionOption.value} value={transitionOption.value}>{transitionOption.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {safeItems.length < 10 && (
            <button type="button" onClick={addItem} className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-dashed border-[var(--builder-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:border-[var(--builder-border-mid)] transition-colors">
              <Plus className="w-3 h-3" />
              Add Dropdown
            </button>
          )}

          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-[var(--builder-text)]">Allow Multiple Open</span>
              <button type="button" title="Toggle multiple open dropdowns" onClick={() => setProp((props: AccordionProps) => { props.allowMultiple = !props.allowMultiple; })} className={`relative w-9 h-5 rounded-full transition-colors ${allowMultiple ? "bg-blue-500" : "bg-[var(--builder-surface-3)]"}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${allowMultiple ? "translate-x-[18px]" : "translate-x-0.5"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-[var(--builder-text)]">Allow Collapse All</span>
              <button type="button" title="Toggle whether all dropdowns can be closed" onClick={() => setProp((props: AccordionProps) => { props.allowCollapseAll = !props.allowCollapseAll; })} className={`relative w-9 h-5 rounded-full transition-colors ${allowCollapseAll !== false ? "bg-blue-500" : "bg-[var(--builder-surface-3)]"}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${allowCollapseAll !== false ? "translate-x-[18px]" : "translate-x-0.5"}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Default Open Index</label>
              <NumericInput value={defaultOpenIndex ?? -1} min={-1} max={Math.max(0, safeItems.length - 1)} onChange={(value) => setProp((props: AccordionProps) => { props.defaultOpenIndex = value; })} />
              <p className="text-[9px] text-[var(--builder-text-faint)]">Use -1 to start with all dropdowns closed.</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Animation (ms)</label>
              <NumericInput value={animationDurationMs ?? 280} min={80} max={1200} unit="ms" onChange={(value) => setProp((props: AccordionProps) => { props.animationDurationMs = value; })} />
            </div>
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Layout & Layer" defaultOpen={false}>
        <LayoutLayerGroup
          nodeId={id}
          position={position}
          display={display}
          isFreeform={isFreeform}
          alignSelf={alignSelf}
          zIndex={zIndex}
          top={top}
          right={right}
          bottom={bottom}
          left={left}
          editorVisibility={editorVisibility}
          setProp={setProp as any}
        />
      </DesignSection>

      <DesignSection title="Size & Spacing" defaultOpen={false}>
        <div className="flex flex-col gap-2 mb-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Height</label>
              <input
                type="text"
                title="Accordion height"
                placeholder="auto or 240px"
                value={height ?? ""}
                onChange={(event) => setProp((props: AccordionProps) => { props.height = event.target.value || undefined; })}
                className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Max Width</label>
              <input
                type="text"
                title="Accordion max width"
                placeholder="100% or 420px"
                value={maxWidth ?? "100%"}
                onChange={(event) => setProp((props: AccordionProps) => { props.maxWidth = event.target.value || "100%"; })}
                className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none"
              />
            </div>
          </div>
        </div>
        <SizePositionGroup
          width={width}
          height={height}
          minHeight={minHeight}
          marginTop={marginTop}
          marginRight={marginRight}
          marginBottom={marginBottom}
          marginLeft={marginLeft}
          setProp={setProp as any}
        />
      </DesignSection>

      <DesignSection title="Typography" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Font Size</label>
              <NumericInput value={headerFontSize ?? 14} min={10} max={64} onChange={(value) => setProp((props: AccordionProps) => { props.headerFontSize = value; })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Font Weight</label>
              <select
                title="Header font weight"
                value={headerFontWeight ?? "600"}
                onChange={(event) => setProp((props: AccordionProps) => { props.headerFontWeight = event.target.value; })}
                className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none"
              >
                <option value="300">Light</option>
                <option value="400">Regular</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
                <option value="700">Bold</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Text Align</label>
              <select
                title="Header text alignment"
                value={headerTextAlign ?? "left"}
                onChange={(event) => setProp((props: AccordionProps) => { props.headerTextAlign = event.target.value as any; })}
                className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Header Color</label>
              <ColorPicker value={headerTextColor ?? "#10213f"} onChange={(value) => setProp((props: AccordionProps) => { props.headerTextColor = value; })} className="w-full" />
            </div>
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Header Layout" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Icon Position</label>
              <select
                title="Dropdown icon side"
                value={iconPosition ?? "right"}
                onChange={(event) => setProp((props: AccordionProps) => { props.iconPosition = event.target.value as "left" | "right"; })}
                className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none"
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Header Gap</label>
              <NumericInput
                value={headerGap ?? 12}
                min={0}
                max={80}
                onChange={(value) => setProp((props: AccordionProps) => { props.headerGap = value; })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Padding X</label>
              <NumericInput
                value={headerPaddingX ?? 12}
                min={0}
                max={80}
                onChange={(value) => setProp((props: AccordionProps) => { props.headerPaddingX = value; })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Padding Y</label>
              <NumericInput
                value={headerPaddingY ?? 10}
                min={0}
                max={80}
                onChange={(value) => setProp((props: AccordionProps) => { props.headerPaddingY = value; })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Text Offset X</label>
              <NumericInput
                value={textOffsetX ?? 0}
                min={-200}
                max={200}
                onChange={(value) => setProp((props: AccordionProps) => { props.textOffsetX = value; })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Text Offset Y</label>
              <NumericInput
                value={textOffsetY ?? 0}
                min={-200}
                max={200}
                onChange={(value) => setProp((props: AccordionProps) => { props.textOffsetY = value; })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Icon Offset X</label>
              <NumericInput
                value={iconOffsetX ?? 0}
                min={-200}
                max={200}
                onChange={(value) => setProp((props: AccordionProps) => { props.iconOffsetX = value; })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Icon Offset Y</label>
              <NumericInput
                value={iconOffsetY ?? 0}
                min={-200}
                max={200}
                onChange={(value) => setProp((props: AccordionProps) => { props.iconOffsetY = value; })}
              />
            </div>
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Appearance" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Container Background</label>
            <ColorPicker value={backgroundColor ?? "transparent"} onChange={(value) => setProp((props: AccordionProps) => { props.backgroundColor = value; })} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Border Color</label>
            <ColorPicker value={borderColor ?? "#d4dfef"} onChange={(value) => setProp((props: AccordionProps) => { props.borderColor = value; })} className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Border Radius</label>
              <NumericInput value={borderRadius ?? 10} min={0} max={64} onChange={(value) => setProp((props: AccordionProps) => { props.borderRadius = value; })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Border Width</label>
              <NumericInput value={borderWidth ?? 1} min={0} max={12} onChange={(value) => setProp((props: AccordionProps) => { props.borderWidth = value; })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Icon Color</label>
              <ColorPicker value={iconColor ?? "#4a89ff"} onChange={(value) => setProp((props: AccordionProps) => { props.iconColor = value; })} className="w-full" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Option Text</label>
              <ColorPicker value={contentTextColor ?? "#334155"} onChange={(value) => setProp((props: AccordionProps) => { props.contentTextColor = value; })} className="w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Option Font Size</label>
            <NumericInput value={contentFontSize ?? 13} min={10} max={32} onChange={(value) => setProp((props: AccordionProps) => { props.contentFontSize = value; })} />
          </div>
        </div>
      </DesignSection>
    </div>
  );
};
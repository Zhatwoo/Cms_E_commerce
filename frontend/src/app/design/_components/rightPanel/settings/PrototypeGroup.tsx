"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useEditor } from "@craftjs/core";
import { DesignSection } from "./DesignSection";
import type {
  PrototypeConfig,
  Interaction,
  InteractionTrigger,
  InteractionAction,
  TransitionType,
} from "../../../_types/prototype";
import type { EasingType } from "../../../_types/animation";
import { DEFAULT_PROTOTYPE } from "../../../_types/prototype";

const selectClass =
  "w-full bg-builder-surface-2 rounded-md text-xs text-builder-text px-2.5 py-1.5 focus:outline-none appearance-none cursor-pointer";
const labelClass = "text-[12px] text-builder-text font-base";
const sliderClass = "w-full accent-builder-accent cursor-pointer";

const TRIGGER_LABELS: Record<InteractionTrigger, string> = {
  click: "On click",
  doubleClick: "On double click",
  hover: "On hover",
  mouseLeave: "On mouse leave",
};

const ACTION_LABELS: Record<InteractionAction, string> = {
  navigateTo: "Navigate to",
  openUrl: "Open URL",
  scrollTo: "Scroll to",
  back: "Back",
  openOverlay: "Open overlay",
  closeOverlay: "Close overlay",
};

const TRANSITION_LABELS: Record<TransitionType, string> = {
  instant: "Instant",
  dissolve: "Dissolve",
  slideLeft: "Slide left",
  slideRight: "Slide right",
  slideUp: "Slide up",
  slideDown: "Slide down",
  push: "Push",
  moveIn: "Move in",
};

const EASING_LABELS: Record<EasingType, string> = {
  linear: "Linear",
  easeIn: "Ease in",
  easeOut: "Ease out",
  easeInOut: "Ease in out",
  circIn: "Circle in",
  circOut: "Circle out",
  circInOut: "Circle in out",
  backIn: "Back in",
  backOut: "Back out",
  backInOut: "Back in out",
  anticipate: "Anticipate",
};

function getPrototype(props: Record<string, unknown>): PrototypeConfig {
  const raw = props.prototype as PrototypeConfig | undefined;
  if (!raw?.interactions) return { ...DEFAULT_PROTOTYPE };
  return { interactions: [...raw.interactions] };
}

function clonePrototype(config: PrototypeConfig): PrototypeConfig {
  return JSON.parse(JSON.stringify(config));
}

export interface PageOption {
  id: string;
  name: string;
  slug: string;
  index: number;
}

function toPageIdentifierName(pageName: string | undefined, pageIndex: number): string {
  const trimmed = String(pageName || "").trim();
  if (!trimmed) return `Page ${pageIndex + 1}`;
  if (/^page\s*name$/i.test(trimmed)) return `Page ${pageIndex + 1}`;
  if (/^untitled\s*page$/i.test(trimmed)) return `Page ${pageIndex + 1}`;
  return trimmed;
}

interface PrototypeGroupProps {
  selectedIds: string[];
}

export const PrototypeGroup = ({ selectedIds }: PrototypeGroupProps) => {
  const firstId = selectedIds[0];
  const { actions, query } = useEditor();

  // Revision counter — bumped after every mutation so useMemo re-reads fresh state
  const [rev, setRev] = useState(0);

  /** Read fresh prototype directly from editor store. */
  const readPrototype = useCallback((): PrototypeConfig => {
    try {
      const state = query.getState();
      return getPrototype(state.nodes[firstId]?.data?.props ?? {});
    } catch {
      return { ...DEFAULT_PROTOTYPE };
    }
  }, [query, firstId]);

  // Recompute when selection changes OR after a mutation (rev changes)
  const prototype = useMemo<PrototypeConfig>(
    () => readPrototype(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readPrototype, rev]
  );

  const pages = useMemo<PageOption[]>(() => {
    try {
      const state = query.getState();
      const nodes = state.nodes ?? {};
      const rootNode = nodes["ROOT"];
      const pageIds = (rootNode?.data?.nodes as string[] | undefined) ?? [];
      const list: PageOption[] = [];
      pageIds.forEach((id, index) => {
        const node = nodes[id];
        if (node?.data?.displayName === "Page") {
          const props = node.data.props ?? {};
          const rawName = props.pageName as string | undefined;
          const name = toPageIdentifierName(rawName, index);
          list.push({
            id,
            name,
            slug: (props.pageSlug as string) ?? `page-${index}`,
            index,
          });
        }
      });
      return list;
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedIds, rev]);

  /** Write prototype to all selected nodes, then bump rev to refresh UI. */
  const commitPrototype = useCallback(
    (next: PrototypeConfig) => {
      selectedIds.forEach((nodeId) => {
        actions.setProp(nodeId, (props: Record<string, unknown>) => {
          props.prototype = next;
        });
      });
      setRev((r) => r + 1);
    },
    [actions, selectedIds]
  );

  const addInteraction = useCallback(() => {
    const current = readPrototype();
    const next = clonePrototype(current);
    const fallbackDestination = pages[0]?.id;
    next.interactions.push({
      trigger: "click",
      action: "navigateTo",
      destination: fallbackDestination,
      duration: 300,
      easing: "ease",
      transition: "dissolve",
    });
    commitPrototype(next);
  }, [readPrototype, commitPrototype, pages]);

  const removeInteraction = useCallback(
    (index: number) => {
      const current = readPrototype();
      const next = clonePrototype(current);
      next.interactions.splice(index, 1);
      commitPrototype(next);
    },
    [readPrototype, commitPrototype]
  );

  const updateInteraction = useCallback(
    (index: number, patch: Partial<Interaction>) => {
      const current = readPrototype();
      const next = clonePrototype(current);
      const interaction = next.interactions[index];
      if (!interaction) return;
      Object.assign(interaction, patch);
      commitPrototype(next);
    },
    [readPrototype, commitPrototype]
  );

  const isPageReference = (dest: string | undefined) =>
    dest && pages.some((p) => p.id === dest || p.slug === dest);

  const resolveDestinationPage = useCallback(
    (dest: string | undefined): PageOption | null => {
      if (!dest) return null;
      return pages.find((p) => p.id === dest || p.slug === dest) ?? null;
    },
    [pages]
  );

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Prototype" defaultOpen={true}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className={labelClass}>Interactions</span>
            <button
              type="button"
              onClick={addInteraction}
              className="text-xs px-2 py-1 rounded bg-builder-surface-3 hover:bg-builder-surface-hover text-builder-text"
            >
              Add interaction
            </button>
          </div>

          {prototype.interactions.length === 0 ? (
            <p className="text-[10px] text-builder-text-faint">No interactions. Add one to link to a page or URL.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {prototype.interactions.map((interaction, index) => (
                <div
                  key={index}
                  className="border border-(--builder-border-mid) rounded-lg p-2.5 space-y-2 bg-builder-surfaceer/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-builder-text-faint uppercase">Interaction {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeInteraction(index)}
                      className="text-builder-text-faint hover:text-red-400 text-xs cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Trigger</label>
                    <select
                      value={interaction.trigger}
                      onChange={(e) =>
                        updateInteraction(index, { trigger: e.target.value as InteractionTrigger })
                      }
                      title="Trigger"
                      className={selectClass}
                    >
                      {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Action</label>
                    <select
                      value={interaction.action}
                      onChange={(e) =>
                        updateInteraction(index, { action: e.target.value as InteractionAction })
                      }
                      title="Action"
                      className={selectClass}
                    >
                      {Object.entries(ACTION_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  {(interaction.action === "navigateTo" || interaction.action === "openUrl" || interaction.action === "scrollTo") && (
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>
                        {interaction.action === "openUrl" ? "URL" : "Destination"}
                        {interaction.action === "navigateTo" && isPageReference(interaction.destination) && (
                          <span className="ml-1 text-blue-400" title="Page">📄</span>
                        )}
                      </label>
                      {interaction.action === "navigateTo" ? (
                        <select
                          value={interaction.destination ?? ""}
                          onChange={(e) =>
                            updateInteraction(index, { destination: e.target.value || undefined })
                          }
                          title="Destination"
                          className={selectClass}
                        >
                          <option value="">Select page</option>
                          {pages.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={interaction.destination ?? ""}
                          onChange={(e) =>
                            updateInteraction(index, { destination: e.target.value || undefined })
                          }
                          title={interaction.action === "openUrl" ? "URL" : "Destination"}
                          placeholder={interaction.action === "openUrl" ? "https://..." : "Element ID"}
                          className="w-full bg-builder-surface-2 rounded-md text-xs text-builder-text px-2.5 py-1.5 focus:outline-none"
                        />
                      )}
                      {interaction.action === "navigateTo" && interaction.destination ? (
                        <p className="text-[10px] text-builder-text-faint">
                          {(() => {
                            const page = resolveDestinationPage(interaction.destination);
                            if (!page) return `Destination: ${interaction.destination}`;
                            return `Destination: ${page.name}`;
                          })()}
                        </p>
                      ) : null}
                    </div>
                  )}

                  {interaction.action === "navigateTo" && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className={labelClass}>Transition</label>
                        <select
                          value={interaction.transition ?? "dissolve"}
                          onChange={(e) =>
                            updateInteraction(index, { transition: e.target.value as TransitionType })
                          }
                          title="Transition"
                          className={selectClass}
                        >
                          {Object.entries(TRANSITION_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between">
                          <label className={labelClass}>Duration</label>
                          <span className="text-[10px] text-builder-text-faint">{interaction.duration ?? 300}ms</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          step="50"
                          value={interaction.duration ?? 300}
                          onChange={(e) =>
                            updateInteraction(index, { duration: Number(e.target.value) })
                          }
                          title="Duration"
                          className={sliderClass}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={labelClass}>Easing</label>
                        <select
                          value={interaction.easing ?? "ease"}
                          onChange={(e) =>
                            updateInteraction(index, { easing: e.target.value as EasingType })
                          }
                          title="Easing"
                          className={selectClass}
                        >
                          {Object.entries(EASING_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DesignSection>
    </div>
  );
};

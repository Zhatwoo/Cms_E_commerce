"use client";

import React, { useCallback } from "react";
import { useEditor } from "@craftjs/core";
import { DesignSection } from "./DesignSection";
import {
  DEFAULT_ANIMATION,
  ANIMATE_IN_LABELS,
  ANIMATE_OUT_LABELS,
  ANIMATE_DURING_LABELS,
  EASING_LABELS,
  SCROLL_EFFECT_LABELS,
  TRIGGER_LABELS,
} from "../../../_types/animation";
import type {
  AnimationConfig,
  AnimateInType,
  AnimateOutType,
  AnimateDuringType,
  EasingType,
  ScrollEffectType,
  TriggerType,
} from "../../../_types/animation";

const selectClass =
  "w-full bg-brand-medium-dark rounded-md text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none appearance-none cursor-pointer";
const labelClass = "text-[12px] text-brand-lighter font-base";
const subLabelClass = "text-[10px] text-brand-light";
const sliderClass = "w-full accent-brand-light cursor-pointer";
const checkboxClass = "accent-brand-light cursor-pointer";

function getAnimation(props: Record<string, unknown>): AnimationConfig {
  const raw = props.animation as AnimationConfig | undefined;
  if (!raw) return { ...DEFAULT_ANIMATION };
  return {
    animateIn: { ...DEFAULT_ANIMATION.animateIn, ...(raw.animateIn ?? {}) },
    animateOut: { ...DEFAULT_ANIMATION.animateOut, ...(raw.animateOut ?? {}) },
    animateDuring: { ...DEFAULT_ANIMATION.animateDuring, ...(raw.animateDuring ?? {}) },
    scrollEffect: { ...DEFAULT_ANIMATION.scrollEffect, ...(raw.scrollEffect ?? {}) },
    trigger: { ...DEFAULT_ANIMATION.trigger, ...(raw.trigger ?? {}) },
  };
}

/** Deep-clone animation config so we can mutate it without touching Craft.js frozen state. */
function cloneAnimation(config: AnimationConfig): AnimationConfig {
  return JSON.parse(JSON.stringify(config));
}

function setAtPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  let target: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const next = target[k] as Record<string, unknown> | undefined;
    if (!next || typeof next !== "object") {
      target[k] = {};
      target = target[k] as Record<string, unknown>;
    } else {
      target = next;
    }
  }
  target[keys[keys.length - 1]] = value;
}

interface AnimationGroupProps {
  selectedIds: string[];
}

export const AnimationGroup = ({ selectedIds }: AnimationGroupProps) => {
  const firstId = selectedIds[0];
  const animation = useEditor((state) =>
    getAnimation(state.nodes[firstId]?.data?.props ?? {})
  );
  const { actions } = useEditor();

  const update = useCallback(
    (path: string, value: unknown) => {
      selectedIds.forEach((nodeId) => {
        actions.setProp(nodeId, (props: Record<string, unknown>) => {
          const current = getAnimation(props);
          const next = cloneAnimation(current);
          setAtPath(next as unknown as Record<string, unknown>, path, value);
          props.animation = next;
        });
      });
    },
    [actions, selectedIds]
  );

  return (
    <div className="flex flex-col pb-4">
      {/* ─── Trigger ─── */}
      <DesignSection title="Trigger">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Trigger Event</label>
            <select
              value={animation.trigger.type}
              onChange={(e) => update("trigger.type", e.target.value as TriggerType)}
              className={selectClass}
            >
              {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {animation.trigger.type === "onScroll" && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <label className={labelClass}>Visibility Threshold</label>
                <span className={subLabelClass}>{Math.round(animation.trigger.threshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={animation.trigger.threshold}
                onChange={(e) => update("trigger.threshold", Number(e.target.value))}
                className={sliderClass}
              />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={animation.trigger.once}
              onChange={(e) => update("trigger.once", e.target.checked)}
              className={checkboxClass}
            />
            <span className={labelClass}>Play only once</span>
          </label>
        </div>
      </DesignSection>

      {/* ─── Animate In ─── */}
      <DesignSection title="Animate In">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Animation</label>
            <select
              value={animation.animateIn.type}
              onChange={(e) => update("animateIn.type", e.target.value as AnimateInType)}
              className={selectClass}
            >
              {Object.entries(ANIMATE_IN_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {animation.animateIn.type !== "none" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <label className={labelClass}>Duration</label>
                    <span className={subLabelClass}>{animation.animateIn.duration}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={animation.animateIn.duration}
                    onChange={(e) => update("animateIn.duration", Number(e.target.value))}
                    className={sliderClass}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <label className={labelClass}>Delay</label>
                    <span className={subLabelClass}>{animation.animateIn.delay}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={animation.animateIn.delay}
                    onChange={(e) => update("animateIn.delay", Number(e.target.value))}
                    className={sliderClass}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Easing</label>
                <select
                  value={animation.animateIn.easing}
                  onChange={(e) => update("animateIn.easing", e.target.value as EasingType)}
                  className={selectClass}
                >
                  {Object.entries(EASING_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {["slideUp", "slideDown", "slideLeft", "slideRight"].includes(animation.animateIn.type) && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <label className={labelClass}>Distance</label>
                    <span className={subLabelClass}>{animation.animateIn.distance}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={animation.animateIn.distance}
                    onChange={(e) => update("animateIn.distance", Number(e.target.value))}
                    className={sliderClass}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <label className={labelClass}>Stagger Children</label>
                  <span className={subLabelClass}>{animation.animateIn.stagger}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.02"
                  value={animation.animateIn.stagger}
                  onChange={(e) => update("animateIn.stagger", Number(e.target.value))}
                  className={sliderClass}
                />
              </div>
            </>
          )}
        </div>
      </DesignSection>

      {/* ─── Animate Out ─── */}
      <DesignSection title="Animate Out" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Animation</label>
            <select
              value={animation.animateOut.type}
              onChange={(e) => update("animateOut.type", e.target.value as AnimateOutType)}
              className={selectClass}
            >
              {Object.entries(ANIMATE_OUT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {animation.animateOut.type !== "none" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <label className={labelClass}>Duration</label>
                    <span className={subLabelClass}>{animation.animateOut.duration}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={animation.animateOut.duration}
                    onChange={(e) => update("animateOut.duration", Number(e.target.value))}
                    className={sliderClass}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <label className={labelClass}>Delay</label>
                    <span className={subLabelClass}>{animation.animateOut.duration}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={animation.animateOut.delay}
                    onChange={(e) => update("animateOut.delay", Number(e.target.value))}
                    className={sliderClass}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Easing</label>
                <select
                  value={animation.animateOut.easing}
                  onChange={(e) => update("animateOut.easing", e.target.value as EasingType)}
                  className={selectClass}
                >
                  {Object.entries(EASING_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {["slideUp", "slideDown", "slideLeft", "slideRight"].includes(animation.animateOut.type) && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <label className={labelClass}>Distance</label>
                    <span className={subLabelClass}>{animation.animateOut.distance}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={animation.animateOut.distance}
                    onChange={(e) => update("animateOut.distance", Number(e.target.value))}
                    className={sliderClass}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </DesignSection>

      {/* ─── Animate During (Continuous) ─── */}
      <DesignSection title="Continuous Animation" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Animation</label>
            <select
              value={animation.animateDuring.type}
              onChange={(e) => update("animateDuring.type", e.target.value as AnimateDuringType)}
              className={selectClass}
            >
              {Object.entries(ANIMATE_DURING_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {animation.animateDuring.type !== "none" && (
            <>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <label className={labelClass}>Duration</label>
                  <span className={subLabelClass}>{animation.animateDuring.duration}s</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="5"
                  step="0.1"
                  value={animation.animateDuring.duration}
                  onChange={(e) => update("animateDuring.duration", Number(e.target.value))}
                  className={sliderClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <label className={labelClass}>Intensity</label>
                  <span className={subLabelClass}>{animation.animateDuring.intensity}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={animation.animateDuring.intensity}
                  onChange={(e) => update("animateDuring.intensity", Number(e.target.value))}
                  className={sliderClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Repeat</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="iterCount"
                      checked={animation.animateDuring.iterationCount === "infinite"}
                      onChange={() => update("animateDuring.iterationCount", "infinite")}
                      className={checkboxClass}
                    />
                    <span className={subLabelClass}>Infinite</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="iterCount"
                      checked={animation.animateDuring.iterationCount !== "infinite"}
                      onChange={() => update("animateDuring.iterationCount", 3)}
                      className={checkboxClass}
                    />
                    <span className={subLabelClass}>Count</span>
                  </label>
                  {animation.animateDuring.iterationCount !== "infinite" && (
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={animation.animateDuring.iterationCount as number}
                      onChange={(e) => update("animateDuring.iterationCount", Number(e.target.value))}
                      className="w-14 bg-brand-medium-dark rounded-md text-xs text-brand-lighter px-2 py-1 focus:outline-none"
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DesignSection>

      {/* ─── Scroll Effects / Parallax ─── */}
      <DesignSection title="Scroll Effects" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={animation.scrollEffect.enabled}
              onChange={(e) => update("scrollEffect.enabled", e.target.checked)}
              className={checkboxClass}
            />
            <span className={labelClass}>Enable Scroll Effect</span>
          </label>

          {animation.scrollEffect.enabled && (
            <>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Effect Type</label>
                <select
                  value={animation.scrollEffect.type}
                  onChange={(e) => update("scrollEffect.type", e.target.value as ScrollEffectType)}
                  className={selectClass}
                >
                  {Object.entries(SCROLL_EFFECT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {animation.scrollEffect.type !== "none" && (
                <>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <label className={labelClass}>Speed / Intensity</label>
                      <span className={subLabelClass}>{animation.scrollEffect.speed}x</span>
                    </div>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.1"
                      value={animation.scrollEffect.speed}
                      onChange={(e) => update("scrollEffect.speed", Number(e.target.value))}
                      className={sliderClass}
                    />
                    <div className="flex justify-between">
                      <span className={subLabelClass}>Reverse</span>
                      <span className={subLabelClass}>Forward</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Direction</label>
                    <select
                      value={animation.scrollEffect.direction}
                      onChange={(e) => update("scrollEffect.direction", e.target.value)}
                      className={selectClass}
                    >
                      <option value="vertical">Vertical</option>
                      <option value="horizontal">Horizontal</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={animation.scrollEffect.scrub}
                      onChange={(e) => update("scrollEffect.scrub", e.target.checked)}
                      className={checkboxClass}
                    />
                    <span className={labelClass}>Scrub (smooth scroll-linked)</span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>Start</label>
                      <select
                        value={animation.scrollEffect.start}
                        onChange={(e) => update("scrollEffect.start", e.target.value)}
                        className={selectClass}
                      >
                        <option value="top bottom">Top enters bottom</option>
                        <option value="top center">Top enters center</option>
                        <option value="top top">Top enters top</option>
                        <option value="center bottom">Center enters bottom</option>
                        <option value="center center">Center at center</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>End</label>
                      <select
                        value={animation.scrollEffect.end}
                        onChange={(e) => update("scrollEffect.end", e.target.value)}
                        className={selectClass}
                      >
                        <option value="bottom top">Bottom exits top</option>
                        <option value="bottom center">Bottom exits center</option>
                        <option value="center top">Center exits top</option>
                        <option value="top top">Top exits top</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </DesignSection>
    </div>
  );
};

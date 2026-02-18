import React from "react";
import type { InteractionProps } from "../../../_types/components";
import { NumericInput } from "./inputs/NumericInput";

interface InteractionGroupProps extends InteractionProps {
  setProp: (cb: (props: any) => void) => void;
}

const SHOW_ON_OPTIONS: Array<{ value: "" | "desktop" | "mobile"; label: string }> = [
  { value: "", label: "All" },
  { value: "desktop", label: "Desktop only" },
  { value: "mobile", label: "Mobile only" },
];

const ACTION_OPTIONS: Array<{ value: "" | "toggle" | "open" | "close"; label: string }> = [
  { value: "", label: "None" },
  { value: "toggle", label: "Toggle target" },
  { value: "open", label: "Open target" },
  { value: "close", label: "Close target" },
];

const BOOL_OPTIONS: Array<{ value: ""; label: string } | { value: "true" | "false"; label: string }> = [
  { value: "", label: "Auto" },
  { value: "true", label: "True" },
  { value: "false", label: "False" },
];

function parseBoolValue(raw: string): boolean | undefined {
  if (raw === "true") return true;
  if (raw === "false") return false;
  return undefined;
}

function toBoolSelect(v: boolean | undefined): "" | "true" | "false" {
  if (v === true) return "true";
  if (v === false) return "false";
  return "";
}

export const InteractionGroup = ({
  toggleTarget = "",
  triggerAction,
  collapsibleKey = "",
  defaultOpen,
  defaultOpenMobile,
  defaultOpenDesktop,
  showOn,
  mobileBreakpoint = 900,
  setProp,
}: InteractionGroupProps) => {
  const [showGuide, setShowGuide] = React.useState(false);
  const actionValue = triggerAction ?? "";
  const showOnValue = showOn ?? "";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-brand-light uppercase tracking-wider">Interaction Guide</span>
        <button
          type="button"
          onClick={() => setShowGuide((v) => !v)}
          className="text-[10px] px-2 py-1 rounded-md bg-brand-medium-dark text-brand-lighter border border-brand-medium/40 hover:border-brand-light/40"
        >
          {showGuide ? "Hide" : "How it works"}
        </button>
      </div>

      {showGuide && (
        <div className="text-[11px] leading-relaxed text-brand-light bg-brand-medium-dark/40 border border-brand-medium/30 rounded-md p-2">
          1. Set a <strong>Collapsible Key</strong> on the panel you want to show/hide.
          <br />
          2. Set a <strong>Toggle Target</strong> with the exact same value on the trigger element.
          <br />
          3. Choose a <strong>Trigger Action</strong> (toggle, open, or close).
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-brand-lighter">Show On</label>
        <select
          value={showOnValue}
          onChange={(e) =>
            setProp((props) => {
              props.showOn = (e.target.value || undefined) as InteractionProps["showOn"];
            })
          }
          className="w-full bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none appearance-none"
        >
          {SHOW_ON_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value} className="text-brand-light bg-brand-dark">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-brand-lighter">Mobile Breakpoint</label>
        <div className="bg-brand-medium-dark px-2.5 rounded-lg">
          <NumericInput
            value={mobileBreakpoint}
            onChange={(val) =>
              setProp((props) => {
                props.mobileBreakpoint = val;
              })
            }
            min={320}
            max={1920}
            unit="px"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-brand-lighter">Trigger Action</label>
        <select
          value={actionValue}
          onChange={(e) =>
            setProp((props) => {
              props.triggerAction = (e.target.value || undefined) as InteractionProps["triggerAction"];
            })
          }
          className="w-full bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none appearance-none"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value || "none"} value={opt.value} className="text-brand-light bg-brand-dark">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-brand-lighter">Toggle Target</label>
        <input
          type="text"
          value={toggleTarget}
          onChange={(e) =>
            setProp((props) => {
              props.toggleTarget = e.target.value || undefined;
            })
          }
          placeholder="e.g. faq_item_1"
          className="w-full bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none border border-brand-medium/30"
        />
      </div>

      <div className="h-px bg-brand-medium/30" />

      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-brand-lighter">Collapsible Key</label>
        <input
          type="text"
          value={collapsibleKey}
          onChange={(e) =>
            setProp((props) => {
              props.collapsibleKey = e.target.value || undefined;
            })
          }
          placeholder="must match Toggle Target"
          className="w-full bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none border border-brand-medium/30"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-brand-lighter">Default</label>
          <select
            value={toBoolSelect(defaultOpen)}
            onChange={(e) =>
              setProp((props) => {
                props.defaultOpen = parseBoolValue(e.target.value);
              })
            }
            className="w-full bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2 py-1.5 focus:outline-none appearance-none"
          >
            {BOOL_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value} className="text-brand-light bg-brand-dark">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-brand-lighter">Mobile</label>
          <select
            value={toBoolSelect(defaultOpenMobile)}
            onChange={(e) =>
              setProp((props) => {
                props.defaultOpenMobile = parseBoolValue(e.target.value);
              })
            }
            className="w-full bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2 py-1.5 focus:outline-none appearance-none"
          >
            {BOOL_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value} className="text-brand-light bg-brand-dark">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-brand-lighter">Desktop</label>
          <select
            value={toBoolSelect(defaultOpenDesktop)}
            onChange={(e) =>
              setProp((props) => {
                props.defaultOpenDesktop = parseBoolValue(e.target.value);
              })
            }
            className="w-full bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2 py-1.5 focus:outline-none appearance-none"
          >
            {BOOL_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value} className="text-brand-light bg-brand-dark">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

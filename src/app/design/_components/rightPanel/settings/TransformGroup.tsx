import React from "react";
import { FlipHorizontal, FlipVertical } from "lucide-react";
import { NumericInput } from "./inputs/NumericInput";
import type { TransformProps, SetProp } from "../../../_types/components";

interface TransformGroupProps extends TransformProps {
  setProp: SetProp<TransformProps>;
}

export const TransformGroup = ({
  rotation = 0,
  flipHorizontal = false,
  flipVertical = false,
  setProp,
}: TransformGroupProps) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Rotation */}
      <div className="flex flex-col gap-1">
        <label className="text-[12px] text-builder-text-muted font-base">Rotation</label>
        <div className="flex items-center gap-2 bg-builder-surface-2 rounded-lg px-2.5 border border-(--builder-border)">
          <NumericInput
            value={rotation}
            onChange={(val) => setProp((props) => { props.rotation = val; })}
            min={-360}
            max={360}
            step={1}
            unit="°"
            className="flex-1 border-0"
          />
        </div>
      </div>

      {/* Flip H / Flip V */}
      <div className="flex flex-col gap-1">
        <label className="text-[12px] text-builder-text-muted font-base">Flip</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setProp((props) => { props.flipHorizontal = !props.flipHorizontal; })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border transition-colors ${
              flipHorizontal
                ? "bg-builder-accent text-black border-(--builder-accent)"
                : "bg-builder-surface-2 text-builder-text-muted border-(--builder-border) hover:bg-builder-surface-3"
            }`}
            title="Flip horizontal"
          >
            <FlipHorizontal size={16} />
            <span className="text-xs">H</span>
          </button>
          <button
            type="button"
            onClick={() => setProp((props) => { props.flipVertical = !props.flipVertical; })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border transition-colors ${
              flipVertical
                ? "bg-builder-accent text-black border-(--builder-accent)"
                : "bg-builder-surface-2 text-builder-text-muted border-(--builder-border) hover:bg-builder-surface-3"
            }`}
            title="Flip vertical"
          >
            <FlipVertical size={16} />
            <span className="text-xs">V</span>
          </button>
        </div>
      </div>
    </div>
  );
};

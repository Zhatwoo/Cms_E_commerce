import React from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical
} from "lucide-react";

interface AlignmentProps {
  flexDirection?: "row" | "column" | string;
  alignItems?: string;
  justifyContent?: string;
}

interface AlignmentControlProps extends AlignmentProps {
  setProp: (cb: (props: any) => void) => void;
}

export const AlignmentControl = ({ flexDirection = "column", alignItems, justifyContent, setProp }: AlignmentControlProps) => {

  const handleHorizontal = (value: string) => {
    setProp((props: any) => {
      if (props.flexDirection === 'row') {
        props.justifyContent = value;
      } else {
        props.alignItems = value;
      }
    });
  };

  const handleVertical = (value: string) => {
    setProp((props: any) => {
      if (props.flexDirection === 'row') {
        props.alignItems = value;
      } else {
        props.justifyContent = value;
      }
    });
  };

  const activeClass = "bg-brand-light text-brand-dark";
  const inactiveClass = "text-brand-light hover:text-white hover:bg-white/5";
  const btnClass = "p-2 rounded-md transition-all flex items-center justify-center";

  // Determine current active values
  const currentHorizontal = flexDirection === 'row' ? justifyContent : alignItems;
  const currentVertical = flexDirection === 'row' ? alignItems : justifyContent;

  // Helper to match flex values to visual alignment
  const isHActive = (val: string) => {
    // Left/Start
    if (val === 'flex-start' && (currentHorizontal === 'flex-start' || currentHorizontal === 'start')) return true;
    // Center
    if (val === 'center' && currentHorizontal === 'center') return true;
    // Right/End
    if (val === 'flex-end' && (currentHorizontal === 'flex-end' || currentHorizontal === 'end')) return true;
    return false;
  };

  const isVActive = (val: string) => {
    // Top/Start
    if (val === 'flex-start' && (currentVertical === 'flex-start' || currentVertical === 'start')) return true;
    // Center
    if (val === 'center' && currentVertical === 'center') return true;
    // Bottom/End
    if (val === 'flex-end' && (currentVertical === 'flex-end' || currentVertical === 'end')) return true;
    return false;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-brand-dark/50 p-1 rounded-lg border border-brand-medium/20">
        {/* Horizontal Alignment */}
        <div className="flex gap-1">
          <button
            className={`${btnClass} ${isHActive('flex-start') ? activeClass : inactiveClass}`}
            onClick={() => handleHorizontal('flex-start')}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            className={`${btnClass} ${isHActive('center') ? activeClass : inactiveClass}`}
            onClick={() => handleHorizontal('center')}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            className={`${btnClass} ${isHActive('flex-end') ? activeClass : inactiveClass}`}
            onClick={() => handleHorizontal('flex-end')}
            title="Align Right"
          >
            <AlignRight size={16} />
          </button>
        </div>

        <div className="w-px h-6 bg-brand-medium/30 mx-2"></div>

        {/* Vertical Alignment */}
        <div className="flex gap-1">
          <button
            className={`${btnClass} ${isVActive('flex-start') ? activeClass : inactiveClass}`}
            onClick={() => handleVertical('flex-start')}
            title="Align Top"
          >
            <AlignStartVertical size={16} />
          </button>
          <button
            className={`${btnClass} ${isVActive('center') ? activeClass : inactiveClass}`}
            onClick={() => handleVertical('center')}
            title="Align Middle"
          >
            <AlignCenterVertical size={16} />
          </button>
          <button
            className={`${btnClass} ${isVActive('flex-end') ? activeClass : inactiveClass}`}
            onClick={() => handleVertical('flex-end')}
            title="Align Bottom"
          >
            <AlignEndVertical size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

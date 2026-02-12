"use client";

import React, { useState } from "react";
import type { TrackingStep } from "./types";

interface StepListEditorProps {
  steps: TrackingStep[];
  onStepChange: (idx: number, field: string, value: any) => void;
}

export const StepListEditor: React.FC<StepListEditorProps> = ({ steps, onStepChange }) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <div className="space-y-2 max-h-72 overflow-y-auto">
      {steps.map((step, idx) => (
        <div key={idx} className="bg-brand-medium/10 border border-brand-medium/20 rounded-lg p-2">
          <button onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
            className="w-full flex items-center justify-between text-left">
            <span className="text-[11px] text-brand-lighter truncate">
              {step.label || `Step ${idx + 1}`}
              {step.completed && <span className="ml-1 text-green-400">✓</span>}
            </span>
            <span className="text-[10px] text-brand-medium">{expandedStep === idx ? "−" : "+"}</span>
          </button>
          {expandedStep === idx && (
            <div className="mt-2 space-y-2 border-t border-brand-medium/20 pt-2">
              <div>
                <label className="text-[10px] text-brand-lighter">Label</label>
                <input type="text" value={step.label}
                  onChange={(e) => onStepChange(idx, "label", e.target.value)}
                  className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-brand-lighter">Date</label>
                <input type="text" value={step.date || ""}
                  onChange={(e) => onStepChange(idx, "date", e.target.value)}
                  className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-brand-lighter">Description</label>
                <input type="text" value={step.description || ""}
                  onChange={(e) => onStepChange(idx, "description", e.target.value)}
                  className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-brand-lighter">Completed</label>
                <input type="checkbox" checked={step.completed}
                  onChange={(e) => onStepChange(idx, "completed", e.target.checked)}
                  className="w-4 h-4 rounded" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

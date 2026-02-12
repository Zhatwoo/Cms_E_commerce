"use client";

import React from "react";
import type { TrackingStep } from "./types";

interface HorizontalTimelineProps {
  steps: TrackingStep[];
  activeStepIdx: number;
  completedStepColor: string;
  activeStepColor: string;
  pendingStepColor: string;
  valueColor: string;
  labelColor: string;
}

export const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({
  steps, activeStepIdx, completedStepColor, activeStepColor, pendingStepColor, valueColor, labelColor,
}) => (
  <div className="flex items-start justify-between">
    {steps.map((step, idx) => {
      const isCompleted = step.completed;
      const isActive = idx === activeStepIdx;
      const dotColor = isCompleted ? completedStepColor : isActive ? activeStepColor : pendingStepColor;
      return (
        <div key={step.status} className="flex-1 flex flex-col items-center relative">
          {idx > 0 && (
            <div className="absolute top-3 right-1/2 w-full h-0.5"
              style={{ backgroundColor: steps[idx - 1].completed ? completedStepColor : pendingStepColor }} />
          )}
          <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: dotColor }}>
            {isCompleted && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {isActive && !isCompleted && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
          </div>
          <p className="text-xs font-medium mt-2 text-center" style={{ color: isCompleted || isActive ? valueColor : labelColor }}>{step.label}</p>
          {step.date && <p className="text-[10px] mt-0.5 text-center" style={{ color: labelColor }}>{step.date}</p>}
        </div>
      );
    })}
  </div>
);

interface VerticalTimelineProps {
  steps: TrackingStep[];
  activeStepIdx: number;
  completedStepColor: string;
  activeStepColor: string;
  pendingStepColor: string;
  valueColor: string;
  labelColor: string;
}

export const VerticalTimeline: React.FC<VerticalTimelineProps> = ({
  steps, activeStepIdx, completedStepColor, activeStepColor, pendingStepColor, valueColor, labelColor,
}) => (
  <div className="relative pl-8">
    {steps.map((step, idx) => {
      const isCompleted = step.completed;
      const isActive = idx === activeStepIdx;
      const dotColor = isCompleted ? completedStepColor : isActive ? activeStepColor : pendingStepColor;
      const isLast = idx === steps.length - 1;
      return (
        <div key={step.status} className="relative pb-8 last:pb-0">
          {!isLast && (
            <div className="absolute left-[-20px] top-6 w-0.5 h-full"
              style={{ backgroundColor: isCompleted ? completedStepColor : pendingStepColor }} />
          )}
          <div className="absolute left-[-26px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: dotColor }}>
            {isCompleted && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {isActive && !isCompleted && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: isCompleted || isActive ? valueColor : labelColor }}>{step.label}</p>
            {step.date && <p className="text-xs mt-0.5" style={{ color: labelColor }}>{step.date}</p>}
            {step.description && <p className="text-xs mt-1" style={{ color: labelColor }}>{step.description}</p>}
          </div>
        </div>
      );
    })}
  </div>
);

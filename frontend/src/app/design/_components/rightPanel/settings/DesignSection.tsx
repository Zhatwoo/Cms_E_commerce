import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface DesignSection {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

// Dito yung contents ng design section and also title ng mga tabs (SenpaiAdri)
export const DesignSection = ({
  title,
  defaultOpen = true,
  children
}: DesignSection) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col border-b border-brand-medium-light last:border-b-0 pb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between py-2 group cursor-pointer"
      >
        <span className="text-xs font-semibold text-brand-light uppercase tracking-wider group-hover:text-brand-lighter transition-colors">
          {title}
        </span>
        <ChevronDown
          size={14}
          className={`text-brand-light group-hover:text-brand-lighter transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"
            }`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
      >
        <div className="overflow-hidden">
          <div className="pt-1 pb-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

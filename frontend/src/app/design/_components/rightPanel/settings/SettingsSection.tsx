import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface SettingsSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const SettingsSection = ({
  title,
  defaultOpen = true,
  children
}: SettingsSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col border-b border-brand-medium/20 last:border-b-0 pb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between py-2 group cursor-pointer"
      >
        <span className="text-xs font-semibold text-brand-light uppercase tracking-wider group-hover:text-brand-lighter transition-colors">
          {title}
        </span>
        <ChevronDown
          size={14}
          className={`text-brand-medium group-hover:text-brand-lighter transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"
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

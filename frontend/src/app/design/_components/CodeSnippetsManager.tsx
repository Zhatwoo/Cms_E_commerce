"use client";

import React, { useState } from "react";
import { Copy, Plus, Search } from "lucide-react";

export interface CodeSnippet {
  id: string;
  name: string;
  category: "component" | "asset" | "hook" | "utility";
  description: string;
  code: string;
  language: "tsx" | "ts" | "css" | "jsx" | "js";
  tags: string[];
}

interface CodeSnippetsManagerProps {
  onSelectSnippet: (snippet: CodeSnippet) => void;
}

const DEFAULT_SNIPPETS: CodeSnippet[] = [
  {
    id: "button-comp",
    name: "Styled Button",
    category: "component",
    description: "Reusable button component with variants",
    language: "tsx",
    code: `interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-colors';
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600',
    outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50',
  };
  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={\`\${baseClasses} \${variants[variant]} \${sizes[size]}\`}
      {...props}
    >
      {children}
    </button>
  );
};`,
    tags: ["button", "ui", "reusable"],
  },
  {
    id: "card-comp",
    name: "Card Container",
    category: "component",
    description: "Flexible card component with shadows and borders",
    language: "tsx",
    code: `interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
}) => {
  return (
    <div
      className={\`
        rounded-xl border border-gray-200 bg-white p-6 shadow-sm
        \${hoverable ? 'hover:shadow-md hover:scale-105 transition-all' : ''}
        \${className}
      \`}
    >
      {children}
    </div>
  );
};`,
    tags: ["card", "container", "layout"],
  },
  {
    id: "useDebounce",
    name: "useDebounce Hook",
    category: "hook",
    description: "Custom hook for debouncing values",
    language: "ts",
    code: `import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}`,
    tags: ["hook", "performance", "utilities"],
  },
  {
    id: "gradient-animation",
    name: "Gradient Animation",
    category: "asset",
    description: "Animated gradient background utility",
    language: "css",
    code: `@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animated-gradient {
  background: linear-gradient(
    -45deg,
    #ee7752,
    #e73c7e,
    #23a6d5,
    #23d5ab
  );
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}`,
    tags: ["animation", "gradient", "css"],
  },
  {
    id: "format-price",
    name: "Format Price Utility",
    category: "utility",
    description: "Format numbers as currency strings",
    language: "ts",
    code: `export function formatPrice(
  price: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

// Usage: formatPrice(99.99) => "$99.99"`,
    tags: ["utility", "formatting", "price"],
  },
  {
    id: "responsive-grid",
    name: "Responsive Grid",
    category: "component",
    description: "Auto-responsive grid component",
    language: "tsx",
    code: `interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = 3,
  gap = 4,
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: \`repeat(auto-fit, minmax(250px, 1fr))\`,
        gap: \`\${gap}rem\`,
      }}
    >
      {children}
    </div>
  );
};`,
    tags: ["grid", "layout", "responsive"],
  },
];

export const CodeSnippetsManager: React.FC<CodeSnippetsManagerProps> = ({
  onSelectSnippet,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | CodeSnippet["category"]
  >("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    "all",
    "component",
    "asset",
    "hook",
    "utility",
  ] as const;

  const filteredSnippets = DEFAULT_SNIPPETS.filter((snippet) => {
    const matchesSearch =
      snippet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === "all" || snippet.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (code: string, snippetId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(snippetId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-brand-lighter mb-3">
          📚 Code Snippets Library
        </h3>
        <p className="text-xs text-brand-light mb-4">
          Quick-start components and utilities for Next.js development
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-3 text-brand-light"
        />
        <input
          type="text"
          placeholder="Search snippets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-brand-light placeholder-brand-light/50 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-1 text-xs rounded-lg transition-colors ${
              selectedCategory === cat
                ? "bg-blue-500/30 text-blue-300 border border-blue-500/50"
                : "bg-white/5 text-white/60 border border-transparent hover:bg-white/10"
            }`}
          >
            {cat === "all"
              ? "All"
              : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Snippets List */}
      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {filteredSnippets.length > 0 ? (
          filteredSnippets.map((snippet) => (
            <div
              key={snippet.id}
              className="group p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <div
                onClick={() => onSelectSnippet(snippet)}
                className="space-y-1"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-brand-lighter">
                    {snippet.name}
                  </h4>
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                    {snippet.language}
                  </span>
                </div>
                <p className="text-xs text-brand-light/80 line-clamp-2">
                  {snippet.description}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {snippet.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-1.5 py-0.5 bg-purple-500/10 text-purple-300 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(snippet.code, snippet.id);
                }}
                className="mt-2 w-full flex items-center justify-center gap-2 px-2 py-1 bg-green-500/20 text-green-300 hover:bg-green-500/30 rounded text-xs font-medium transition-colors opacity-0 group-hover:opacity-100"
              >
                <Copy size={12} />
                {copiedId === snippet.id ? "Copied!" : "Copy Code"}
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-brand-light/50 text-xs">
            No snippets found
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeSnippetsManager;

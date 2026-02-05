import React, { useState } from "react";
import { useEditor } from "@craftjs/core";
import { ChevronRight, ChevronDown, Box, Type, Layout, Image as ImageIcon } from "lucide-react";

export const FilesPanel = () => {
  const { nodes, actions, selected } = useEditor((state) => ({
    nodes: state.nodes,
    selected: state.events.selected,
  }));

  const LayerItem = ({ nodeId, depth = 0 }: { nodeId: string; depth?: number }) => {
    const [expanded, setExpanded] = useState(true);
    const node = nodes[nodeId];

    if (!node) return null;

    const isSelected = selected.has(nodeId);
    const hasChildren = node.data.nodes && node.data.nodes.length > 0;

    // Determine icon based on node type
    let Icon = Box;
    const name = node.data.displayName || node.data.name || "";

    if (name === "Text") Icon = Type;
    else if (name === "Container") Icon = Layout;
    else if (name === "Image") Icon = ImageIcon;

    const toggleExpansion = (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpanded(!expanded);
    };

    return (
      <div className="flex flex-col gap-1 select-none">
        <div
          onClick={(e) => {
            e.stopPropagation();
            actions.selectNode(nodeId);
          }}
          className={`
            group flex items-center gap-2 py-1 px-1 rounded-md cursor-pointer transition-colors relative
            ${isSelected ? "bg-blue-400/20 text-white" : "text-brand-light hover:bg-brand-medium/20 hover:text-white"}
          `}
          style={{ paddingLeft: `${depth * 10 + 5}px` }}
        >
          {/* Expansion Toggle */}
          <div
            className={`
              p-1 rounded-md hover:bg-white/10 cursor-pointer mr-1
              ${!hasChildren ? "opacity-0 pointer-events-none" : "opacity-100"}
            `}
            onClick={toggleExpansion}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>

          <Icon className="w-4 h-4 opacity-70 shrink-0" />
          <span className="text-sm font-medium truncate flex-1">
            {name || "Node"}
          </span>
        </div>

        {/* Children */}
        {hasChildren && expanded && (
          <div className="flex flex-col gap-1">
            {node.data.nodes.map((childId) => (
              <LayerItem key={childId} nodeId={childId} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-0.5 mt-2 overflow-x-hidden">
      <LayerItem nodeId="ROOT" />
    </div>
  );
};

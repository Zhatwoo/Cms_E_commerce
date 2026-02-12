"use client";

import React, { useState } from "react";

interface GalleryImageEditorProps {
  images: string[];
  maxVisible: number;
  onImagesChange: (images: string[]) => void;
  onMaxVisibleChange: (max: number) => void;
}

/** Add/remove gallery image URLs with thumbnail preview and max-visible control */
export const GalleryImageEditor: React.FC<GalleryImageEditorProps> = ({
  images, maxVisible, onImagesChange, onMaxVisibleChange,
}) => {
  const [newUrl, setNewUrl] = useState("");

  const addImage = () => {
    if (!newUrl.trim()) return;
    onImagesChange([...images, newUrl.trim()]);
    setNewUrl("");
  };

  const removeImage = (idx: number) => {
    onImagesChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
        Gallery Images
      </label>

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <div className="flex-1 flex gap-2 min-w-0">
          <input
            type="text"
            placeholder="https://..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500 break-all"
          />
          <button onClick={addImage} className="px-3 py-2 bg-blue-600 text-white rounded whitespace-nowrap">
            Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-2">
        {images.map((img, idx) => (
          <div key={idx} className="relative">
            <img src={img} alt={`gallery-${idx + 1}`} className="w-full h-16 object-cover rounded border border-brand-medium/20" />
            <button
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 bg-red-600 text-white rounded px-2 py-1 text-xs"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-brand-medium">Show</span>
        <input
          type="number"
          min={0}
          value={maxVisible}
          onChange={(e) => onMaxVisibleChange(parseInt(e.target.value || "0"))}
          className="w-16 px-2 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
        />
        <span className="text-xs text-brand-medium">thumbs</span>
      </div>
    </div>
  );
};

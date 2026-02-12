"use client";

import React from "react";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

/** Single text input row for settings */
export const TextField: React.FC<TextFieldProps> = ({ label, value, onChange }) => (
  <div>
    <label className="text-xs text-brand-lighter block mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
    />
  </div>
);

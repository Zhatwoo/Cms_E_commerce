"use client";
import React from "react";
import { StatsCounterBlock } from "./StatsCounterBlock";
import { TemplateEntry } from "../_types";

export const StatsCounter: TemplateEntry = {
  label: "Stats Counter",
  description: "Row of statistics with large numbers",
  preview: "Stats",
  category: "content",
  element: React.createElement(StatsCounterBlock as any, {}),
};

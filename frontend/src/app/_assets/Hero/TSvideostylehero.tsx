"use client";

import React from "react";
import { VideoStyleHeroBlock } from "./VideoStyleHeroBlock";
import { TemplateEntry } from "../_types";

export const VideoStyleHero: TemplateEntry = {
  label: "Video Style Hero",
  description: "Cinematic dark hero with play button and backdrop blur",
  preview: "Video",
  category: "hero",
  element: React.createElement(VideoStyleHeroBlock as any, {}),
};

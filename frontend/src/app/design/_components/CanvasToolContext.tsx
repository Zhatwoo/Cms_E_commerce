"use client";

import React, { createContext, useContext } from "react";
import type { CanvasTool } from "./BottomPanel";

const CanvasToolContext = createContext<CanvasTool>("move");

export const useCanvasTool = () => useContext(CanvasToolContext);

export const CanvasToolProvider = CanvasToolContext.Provider;

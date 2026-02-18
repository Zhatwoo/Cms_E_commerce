"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Settings } from "../Settings/Settings";
import { TemplateEntry } from "../../_types";

export const SettingsIcon: TemplateEntry = {
  label: "Settings Icon",
  description: "Settings icon",
  preview: React.createElement(Settings, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "settings",
    size: 32,
    color: "#000000",
  }),
  category: "icon",
};
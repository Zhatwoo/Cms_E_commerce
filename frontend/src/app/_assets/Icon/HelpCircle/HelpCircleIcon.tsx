"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { HelpCircle } from "../HelpCircle/HelpCircle";
import { TemplateEntry } from "../../_types";

export const HelpCircleIcon: TemplateEntry = {
  label: "Help Circle Icon",
  description: "Help and FAQ icon",
  preview: React.createElement(HelpCircle, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "helpCircle",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

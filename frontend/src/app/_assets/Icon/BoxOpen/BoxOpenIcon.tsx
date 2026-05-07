"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { BoxOpen } from "../BoxOpen/BoxOpen";
import { TemplateEntry } from "../../_types";

export const BoxOpenIcon: TemplateEntry = {
  label: "Box Open Icon",
  description: "Open package icon",
  preview: React.createElement(BoxOpen, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "boxOpen",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Bell } from "./Bell";
import { TemplateEntry } from "../../_types";

export const BellIcon: TemplateEntry = {
  label: "Bell Icon",
  description: "Notification bell icon",
  preview: React.createElement(Bell, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "bell",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

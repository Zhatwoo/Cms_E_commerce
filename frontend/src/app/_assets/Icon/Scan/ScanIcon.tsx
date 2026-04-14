"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Scan } from "../Scan/Scan";
import { TemplateEntry } from "../../_types";

export const ScanIcon: TemplateEntry = {
  label: "Scan Icon",
  description: "Scan or checkout scanner icon",
  preview: React.createElement(Scan, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "scan",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};
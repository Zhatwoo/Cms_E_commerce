"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { TargetDeal } from "../TargetDeal/TargetDeal";
import { TemplateEntry } from "../../_types";

export const TargetDealIcon: TemplateEntry = {
  label: "Target Deal Icon",
  description: "Promotion target icon",
  preview: React.createElement(TargetDeal, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "targetDeal",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};
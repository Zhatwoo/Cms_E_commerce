"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { PercentOff } from "../PercentOff/PercentOff";
import { TemplateEntry } from "../../_types";

export const PercentOffIcon: TemplateEntry = {
  label: "Percent Off Icon",
  description: "Discount percent icon",
  preview: React.createElement(PercentOff, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "percentOff",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

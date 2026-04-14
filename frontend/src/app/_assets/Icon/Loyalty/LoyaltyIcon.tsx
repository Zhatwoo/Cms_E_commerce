"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Loyalty } from "../Loyalty/Loyalty";
import { TemplateEntry } from "../../_types";

export const LoyaltyIcon: TemplateEntry = {
  label: "Loyalty Icon",
  description: "Loyalty rewards icon",
  preview: React.createElement(Loyalty, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "loyalty",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};
"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Inventory } from "../Inventory/Inventory";
import { TemplateEntry } from "../../_types";

export const InventoryIcon: TemplateEntry = {
  label: "Inventory Icon",
  description: "Inventory grid icon",
  preview: React.createElement(Inventory, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "inventory",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

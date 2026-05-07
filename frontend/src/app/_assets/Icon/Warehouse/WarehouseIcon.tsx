"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Warehouse } from "../Warehouse/Warehouse";
import { TemplateEntry } from "../../_types";

export const WarehouseIcon: TemplateEntry = {
  label: "Warehouse Icon",
  description: "Warehouse icon",
  preview: React.createElement(Warehouse, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "warehouse",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

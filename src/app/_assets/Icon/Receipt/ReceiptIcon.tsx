"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Receipt } from "../Receipt/Receipt";
import { TemplateEntry } from "../../_types";

export const ReceiptIcon: TemplateEntry = {
  label: "Receipt Icon",
  description: "Order receipt icon",
  preview: React.createElement(Receipt, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "receipt",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Barcode } from "../Barcode/Barcode";
import { TemplateEntry } from "../../_types";

export const BarcodeIcon: TemplateEntry = {
  label: "Barcode Icon",
  description: "Barcode scan icon",
  preview: React.createElement(Barcode, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "barcode",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

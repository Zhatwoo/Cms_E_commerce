"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Store } from "../Store/Store";
import { TemplateEntry } from "../../_types";

export const StoreIcon: TemplateEntry = {
  label: "Store Icon",
  description: "Storefront icon",
  preview: React.createElement(Store, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "store",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

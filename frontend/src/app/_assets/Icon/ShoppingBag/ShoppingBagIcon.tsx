"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { ShoppingBag } from "../ShoppingBag/ShoppingBag";
import { TemplateEntry } from "../../_types";

export const ShoppingBagIcon: TemplateEntry = {
  label: "Shopping Bag Icon",
  description: "Shopping bag icon",
  preview: React.createElement(ShoppingBag, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "shoppingBag",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

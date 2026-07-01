"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Cart } from "../Cart/Cart";
import { TemplateEntry } from "../../_types";

export const CartIcon: TemplateEntry = {
  label: "Cart Icon",
  description: "Shopping cart icon",
  preview: React.createElement(Cart, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "cart",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { ShoppingBasket } from "../ShoppingBasket/ShoppingBasket";
import { TemplateEntry } from "../../_types";

export const ShoppingBasketIcon: TemplateEntry = {
  label: "Shopping Basket Icon",
  description: "Shopping basket icon",
  preview: React.createElement(ShoppingBasket, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "shoppingBasket",
    size: 32,
    color: "#000000",
  }),
  category: "icon",
};

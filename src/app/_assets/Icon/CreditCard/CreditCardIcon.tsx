"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { CreditCard } from "../CreditCard/CreditCard";
import { TemplateEntry } from "../../_types";

export const CreditCardIcon: TemplateEntry = {
  label: "Credit Card Icon",
  description: "Credit card payment icon",
  preview: React.createElement(CreditCard, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "creditCard",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

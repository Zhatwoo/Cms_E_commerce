"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Gift } from "../Gift/Gift";
import { TemplateEntry } from "../../_types";

export const GiftIcon: TemplateEntry = {
  label: "Gift Icon",
  description: "Gift or promo icon",
  preview: React.createElement(Gift, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "gift",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};
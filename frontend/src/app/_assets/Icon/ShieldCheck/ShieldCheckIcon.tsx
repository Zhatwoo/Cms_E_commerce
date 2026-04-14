"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { ShieldCheck } from "../ShieldCheck/ShieldCheck";
import { TemplateEntry } from "../../_types";

export const ShieldCheckIcon: TemplateEntry = {
  label: "Shield Check Icon",
  description: "Secure checkout icon",
  preview: React.createElement(ShieldCheck, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "shieldCheck",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

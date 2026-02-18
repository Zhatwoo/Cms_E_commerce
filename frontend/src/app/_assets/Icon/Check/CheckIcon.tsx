"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Check } from "../Check/Check";
import { TemplateEntry } from "../../_types";

export const CheckIcon: TemplateEntry = {
  label: "Check Icon",
  description: "Check icon",
  preview: React.createElement(Check, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "check",
    size: 32,
    color: "#000000",
  }),
  category: "icon",
};
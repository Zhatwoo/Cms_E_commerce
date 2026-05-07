"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Return } from "../Return/Return";
import { TemplateEntry } from "../../_types";

export const ReturnIcon: TemplateEntry = {
  label: "Return Icon",
  description: "Return product icon",
  preview: React.createElement(Return, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "return",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

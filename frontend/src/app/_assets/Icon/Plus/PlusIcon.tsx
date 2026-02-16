"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Plus } from "../Plus/Plus";
import { TemplateEntry } from "../_types";

export const PlusIcon: TemplateEntry = {
  label: "Plus Icon",
  description: "Plus icon",
  preview: React.createElement(Plus, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "plus",
    size: 32,
    color: "#000000",
  }),
  category: "icon",
};
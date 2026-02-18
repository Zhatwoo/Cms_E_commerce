"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { ChevronRight } from "../ChevronRight/ChevronRight";
import { TemplateEntry } from "../../_types";

export const ChevronRightIcon: TemplateEntry = {
  label: "Chevron Right Icon",
  description: "Chevron right icon",
  preview: React.createElement(ChevronRight, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "chevron-right",
    size: 32,
    color: "#000000",
  }),
  category: "icon",
};
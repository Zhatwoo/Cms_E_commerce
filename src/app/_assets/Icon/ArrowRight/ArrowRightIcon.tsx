"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { ArrowRight } from "../ArrowRight/ArrowRight";
import { TemplateEntry } from "../../_types";

export const ArrowRightIcon: TemplateEntry = {
  label: "Arrow Right Icon",
  description: "Arrow right icon",
  preview: React.createElement(ArrowRight, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "arrow-right",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};
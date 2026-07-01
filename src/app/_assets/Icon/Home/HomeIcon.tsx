"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Home } from "../Home/Home";
import { TemplateEntry } from "../../_types";

export const HomeIcon: TemplateEntry = {
  label: "Home Icon",
  description: "Home icon",
  preview: React.createElement(Home, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "home",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};
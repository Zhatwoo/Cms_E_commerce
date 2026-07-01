"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Menu } from "../Menu/Menu";
import { TemplateEntry } from "../../_types";

export const MenuIcon: TemplateEntry = {
  label: "Menu Icon",
  description: "Menu icon",
  preview: React.createElement(Menu, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "menu",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};
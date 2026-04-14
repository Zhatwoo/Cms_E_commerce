"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Package } from "../Package/Package";
import { TemplateEntry } from "../../_types";

export const PackageIcon: TemplateEntry = {
  label: "Package Icon",
  description: "Package icon",
  preview: React.createElement(Package, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "package",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};
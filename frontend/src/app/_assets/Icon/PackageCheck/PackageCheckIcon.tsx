"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { PackageCheck } from "../PackageCheck/PackageCheck";
import { TemplateEntry } from "../../_types";

export const PackageCheckIcon: TemplateEntry = {
  label: "Package Check Icon",
  description: "Delivered package icon",
  preview: React.createElement(PackageCheck, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "packageCheck",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

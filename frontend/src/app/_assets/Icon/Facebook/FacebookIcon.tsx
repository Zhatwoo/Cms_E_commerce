"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Facebook } from "../Facebook/Facebook";
import { TemplateEntry } from "../_types";

export const FacebookIcon: TemplateEntry = {
  label: "Facebook Icon",
  description: "Facebook social media icon",
  preview: React.createElement(Facebook, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "facebook",
    size: 32,
    color: "#1877F2",
  }),
  category: "icon",
};

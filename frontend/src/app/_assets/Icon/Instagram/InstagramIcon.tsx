"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Instagram } from "../Instagram/Instagram";
import { TemplateEntry } from "../_types";

export const InstagramIcon: TemplateEntry = {
  label: "Instagram Icon",
  description: "Instagram social media icon",
  preview: React.createElement(Instagram, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "instagram",
    size: 32,
    color: "#E4405F",
  }),
  category: "icon",
};

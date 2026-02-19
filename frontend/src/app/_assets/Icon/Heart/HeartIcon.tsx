"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Heart } from "../Heart/Heart";
import { TemplateEntry } from "../../_types";

export const HeartIcon: TemplateEntry = {
  label: "Heart Icon",
  description: "Heart icon",
  preview: React.createElement(Heart, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "heart",
    size: 32,
    color: "#000000",
  }),
  category: "icon",
};
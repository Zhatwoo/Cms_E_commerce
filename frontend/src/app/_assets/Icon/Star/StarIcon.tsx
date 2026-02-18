"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Star } from "../Star/Star";
import { TemplateEntry } from "../../_types";

export const StarIcon: TemplateEntry = {
  label: "Star Icon",
  description: "Star icon",
  preview: React.createElement(Star, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "star",
    size: 32,
    color: "#000000",
  }),
  category: "icon",
};
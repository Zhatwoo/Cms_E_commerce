"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Tag } from "../Tag/Tag";
import { TemplateEntry } from "../../_types";

export const TagIcon: TemplateEntry = {
  label: "Tag Icon",
  description: "Discount tag icon",
  preview: React.createElement(Tag, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "tag",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

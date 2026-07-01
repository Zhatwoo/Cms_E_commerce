"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Trash } from "../Trash/Trash";
import { TemplateEntry } from "../../_types";

export const TrashIcon: TemplateEntry = {
  label: "Trash Icon",
  description: "Delete icon",
  preview: React.createElement(Trash, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "trash",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};
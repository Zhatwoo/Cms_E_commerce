"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Close } from "../Close/Close";
import { TemplateEntry } from "../../_types";

export const CloseIcon: TemplateEntry = {
  label: "Close Icon",
  description: "Close icon",
  preview: React.createElement(Close, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "close",
    size: 32,
    color: "#000000",
  }),
  category: "icon",
};
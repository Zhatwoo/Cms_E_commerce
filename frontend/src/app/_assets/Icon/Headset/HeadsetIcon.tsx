"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Headset } from "../Headset/Headset";
import { TemplateEntry } from "../../_types";

export const HeadsetIcon: TemplateEntry = {
  label: "Headset Icon",
  description: "Customer support headset icon",
  preview: React.createElement(Headset, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "headset",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

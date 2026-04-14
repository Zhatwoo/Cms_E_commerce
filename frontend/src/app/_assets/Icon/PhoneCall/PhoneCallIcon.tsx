"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { PhoneCall } from "../PhoneCall/PhoneCall";
import { TemplateEntry } from "../../_types";

export const PhoneCallIcon: TemplateEntry = {
  label: "Phone Call Icon",
  description: "Call support icon",
  preview: React.createElement(PhoneCall, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "phoneCall",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Refund } from "../Refund/Refund";
import { TemplateEntry } from "../../_types";

export const RefundIcon: TemplateEntry = {
  label: "Refund Icon",
  description: "Refund money icon",
  preview: React.createElement(Refund, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "refund",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

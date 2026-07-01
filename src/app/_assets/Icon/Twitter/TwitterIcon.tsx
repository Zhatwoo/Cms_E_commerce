"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Twitter } from "../Twitter/Twitter";
import { TemplateEntry } from "../../_types";

export const TwitterIcon: TemplateEntry = {
  label: "Twitter Icon",
  description: "Twitter social media icon",
  preview: React.createElement(Twitter, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "twitter",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

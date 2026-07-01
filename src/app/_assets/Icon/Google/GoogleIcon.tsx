"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Google } from "../Google/Google";
import { TemplateEntry } from "../../_types";

export const GoogleIcon: TemplateEntry = {
  label: "Google Icon",
  description: "Google social media icon",
  preview: React.createElement(Google, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "google",
    size: 32,
    color: "#4285F4",
  }),
  category: "icon",
};

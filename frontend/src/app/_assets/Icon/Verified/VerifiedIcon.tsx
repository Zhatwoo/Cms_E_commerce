"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Verified } from "../Verified/Verified";
import { TemplateEntry } from "../../_types";

export const VerifiedIcon: TemplateEntry = {
  label: "Verified Icon",
  description: "Verified trust badge icon",
  preview: React.createElement(Verified, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "verified",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

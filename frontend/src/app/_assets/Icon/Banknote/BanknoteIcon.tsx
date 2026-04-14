"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Banknote } from "../Banknote/Banknote";
import { TemplateEntry } from "../../_types";

export const BanknoteIcon: TemplateEntry = {
  label: "Banknote Icon",
  description: "Cash payment icon",
  preview: React.createElement(Banknote, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "banknote",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

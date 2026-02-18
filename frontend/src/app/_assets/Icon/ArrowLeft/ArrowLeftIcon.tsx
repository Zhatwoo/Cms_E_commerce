"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { ArrowLeft } from "../ArrowLeft/ArrowLeft";
import { TemplateEntry } from "../../_types";

export const ArrowLeftIcon: TemplateEntry = {
  label: "Arrow Left Icon",
  description: "Arrow left icon",
  preview: React.createElement(ArrowLeft, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "arrow-left",
    size: 32,
    color: "#000000",
  }),
  category: "icon",
};
"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Search } from "../Search/Search";
import { TemplateEntry } from "../../_types";

export const SearchIcon: TemplateEntry = {
  label: "Search Icon",
  description: "Search icon",
  preview: React.createElement(Search, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "search",
    size: 32,
    color: "#000000",
  }),
  category: "icon",
};
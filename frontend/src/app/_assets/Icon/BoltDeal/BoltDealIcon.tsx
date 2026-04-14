"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { BoltDeal } from "../BoltDeal/BoltDeal";
import { TemplateEntry } from "../../_types";

export const BoltDealIcon: TemplateEntry = {
  label: "Bolt Deal Icon",
  description: "Flash deal icon",
  preview: React.createElement(BoltDeal, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "boltDeal",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

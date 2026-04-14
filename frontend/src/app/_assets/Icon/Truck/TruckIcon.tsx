"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Truck } from "../Truck/Truck";
import { TemplateEntry } from "../../_types";

export const TruckIcon: TemplateEntry = {
  label: "Truck Icon",
  description: "Delivery truck icon",
  preview: React.createElement(Truck, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "truck",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

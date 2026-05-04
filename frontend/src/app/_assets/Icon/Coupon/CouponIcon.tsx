"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Coupon } from "../Coupon/Coupon";
import { TemplateEntry } from "../../_types";

export const CouponIcon: TemplateEntry = {
  label: "Coupon Icon",
  description: "Discount coupon icon",
  preview: React.createElement(Coupon, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "coupon",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

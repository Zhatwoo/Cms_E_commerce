"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Timer } from "../Timer/Timer";
import { TemplateEntry } from "../../_types";

export const TimerIcon: TemplateEntry = {
  label: "Timer Icon",
  description: "Limited-time offer icon",
  preview: React.createElement(Timer, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "timer",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

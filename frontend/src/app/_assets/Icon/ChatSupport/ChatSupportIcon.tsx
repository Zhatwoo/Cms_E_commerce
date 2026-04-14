"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { ChatSupport } from "../ChatSupport/ChatSupport";
import { TemplateEntry } from "../../_types";

export const ChatSupportIcon: TemplateEntry = {
  label: "Chat Support Icon",
  description: "Live chat support icon",
  preview: React.createElement(ChatSupport, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "chatSupport",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { MailSupport } from "../MailSupport/MailSupport";
import { TemplateEntry } from "../../_types";

export const MailSupportIcon: TemplateEntry = {
  label: "Mail Support Icon",
  description: "Email support icon",
  preview: React.createElement(MailSupport, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "mailSupport",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};
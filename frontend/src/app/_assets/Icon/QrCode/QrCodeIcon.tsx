"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { QrCode } from "../QrCode/QrCode";
import { TemplateEntry } from "../../_types";

export const QrCodeIcon: TemplateEntry = {
  label: "QR Code Icon",
  description: "QR payment icon",
  preview: React.createElement(QrCode, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "qrCode",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

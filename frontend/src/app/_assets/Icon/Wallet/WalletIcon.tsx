"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Wallet } from "../Wallet/Wallet";
import { TemplateEntry } from "../../_types";

export const WalletIcon: TemplateEntry = {
  label: "Wallet Icon",
  description: "Wallet payment icon",
  preview: React.createElement(Wallet, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType: "wallet",
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
};

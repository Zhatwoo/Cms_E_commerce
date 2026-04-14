"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import type { TemplateEntry } from "../../_types";
import {
  DebitCard,
  BankTransfer,
  PosTerminal,
  Invoice,
  CashOnDelivery,
  DeliveryBike,
  Tracking,
  ReturnBox,
  WarehouseShelf,
  PickupPoint,
  FilterIconCommerce,
  SortIconCommerce,
  Compare,
  Wishlist,
  RecentlyViewed,
  MoneyBack,
  VerifiedSeller,
  BestPrice,
  AuthenticProduct,
  BundleOffer,
} from "./CommercePlus";

const make = (
  label: string,
  description: string,
  iconType: string,
  Preview: React.FC<{ className?: string; size?: number }>
): TemplateEntry => ({
  label,
  description,
  preview: React.createElement(Preview, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType,
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
});

export const DebitCardIcon = make("Debit Card Icon", "Debit card payment icon", "debitCard", DebitCard);
export const BankTransferIcon = make("Bank Transfer Icon", "Bank transfer icon", "bankTransfer", BankTransfer);
export const PosTerminalIcon = make("POS Terminal Icon", "POS terminal icon", "posTerminal", PosTerminal);
export const InvoiceIcon = make("Invoice Icon", "Invoice and billing icon", "invoice", Invoice);
export const CashOnDeliveryIcon = make("Cash On Delivery Icon", "COD payment icon", "cashOnDelivery", CashOnDelivery);
export const DeliveryBikeIcon = make("Delivery Bike Icon", "Delivery bike icon", "deliveryBike", DeliveryBike);
export const TrackingIcon = make("Tracking Icon", "Shipment tracking icon", "tracking", Tracking);
export const ReturnBoxIcon = make("Return Box Icon", "Return package icon", "returnBox", ReturnBox);
export const WarehouseShelfIcon = make("Warehouse Shelf Icon", "Warehouse shelf icon", "warehouseShelf", WarehouseShelf);
export const PickupPointIcon = make("Pickup Point Icon", "Pickup point icon", "pickupPoint", PickupPoint);
export const FilterCommerceIcon = make("Filter Icon", "Product filter icon", "filterCommerce", FilterIconCommerce);
export const SortCommerceIcon = make("Sort Icon", "Sorting icon", "sortCommerce", SortIconCommerce);
export const CompareIcon = make("Compare Icon", "Compare products icon", "compare", Compare);
export const WishlistIcon = make("Wishlist Icon", "Wishlist icon", "wishlist", Wishlist);
export const RecentlyViewedIcon = make("Recently Viewed Icon", "Recently viewed icon", "recentlyViewed", RecentlyViewed);
export const MoneyBackIcon = make("Money Back Icon", "Money-back guarantee icon", "moneyBack", MoneyBack);
export const VerifiedSellerIcon = make("Verified Seller Icon", "Verified seller icon", "verifiedSeller", VerifiedSeller);
export const BestPriceIcon = make("Best Price Icon", "Best price tag icon", "bestPrice", BestPrice);
export const AuthenticProductIcon = make("Authentic Product Icon", "Authentic product icon", "authenticProduct", AuthenticProduct);
export const BundleOfferIcon = make("Bundle Offer Icon", "Bundle offer icon", "bundleOffer", BundleOffer);

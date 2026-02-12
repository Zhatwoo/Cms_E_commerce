"use client";

import React, { useRef } from "react";
import { useNode } from "@craftjs/core";
import type { OrderTrackingLayoutProps } from "../_shared/types";
import {
  defaultOrderTrackingItems,
  defaultTrackingSteps,
  orderStatusLabels,
  orderTrackingCraftProps,
  defaultCraftRules,
} from "../_shared";
import { HorizontalTimeline, VerticalTimeline } from "../_shared/TrackingTimeline";
import { OrderTrackingLayoutSettings } from "./OrderTrackingLayoutSettings";

export type { OrderTrackingLayoutProps };

export const OrderTrackingLayout: React.FC<OrderTrackingLayoutProps> = ({
  orderNumber = "ORD-2026-00847",
  trackingNumber = "1Z999AA10123456784",
  currentStatus = "shipped",
  estimatedDelivery = "February 14, 2026",
  orderDate = "February 8, 2026",

  // Shipping
  shippingName = "John Doe",
  shippingAddress = "123 Main Street, Apt 4B",
  shippingCity = "New York",
  shippingState = "NY",
  shippingZip = "10001",
  shippingCountry = "United States",

  // Carrier
  carrierName = "UPS",
  carrierLogo = "",
  carrierTrackingUrl = "#",

  // Items
  items = defaultOrderTrackingItems,

  // Steps
  steps = defaultTrackingSteps,

  // Layout
  showItemsSummary = true,
  showShippingAddress = true,
  showCarrierInfo = true,
  showContactSupport = true,
  showEstimatedDelivery = true,
  layoutMode = "vertical",

  // Colors
  backgroundColor = "#f8fafc",
  cardBackgroundColor = "#ffffff",
  titleColor = "#0f172a",
  labelColor = "#64748b",
  valueColor = "#1e293b",
  borderColor = "#e2e8f0",
  activeStepColor = "#3b82f6",
  completedStepColor = "#22c55e",
  pendingStepColor = "#cbd5e1",
  buttonBackgroundColor = "#3b82f6",
  buttonTextColor = "#ffffff",
  statusBadgeColor = "#dbeafe",
  statusBadgeTextColor = "#1d4ed8",

  // Styling
  borderRadius = 12,
  buttonBorderRadius = 10,

  // Content
  title = "Order Tracking",
  contactButtonText = "Contact Support",
  itemsSummaryTitle = "Order Items",
  shippingTitle = "Shipping Address",
  carrierTitle = "Carrier Information",
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  const containerRef = useRef<HTMLDivElement>(null);

  const orderTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Find index of current active step
  const activeStepIdx = steps.findIndex((s) => s.status === currentStatus);

  const cardStyle = {
    backgroundColor: cardBackgroundColor,
    borderRadius: `${borderRadius}px`,
    border: `1px solid ${borderColor}`,
  };

  return (
    <div
      ref={(ref) => {
        if (ref) {
          containerRef.current = ref;
          connect(drag(ref));
        }
      }}
      className="w-full"
      style={{ backgroundColor }}
    >
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: titleColor }}>
              {title}
            </h1>
            <p className="text-sm mt-1" style={{ color: labelColor }}>
              Order placed on {orderDate}
            </p>
          </div>
          <span
            className="px-3 py-1.5 text-sm font-semibold rounded-full"
            style={{
              backgroundColor: statusBadgeColor,
              color: statusBadgeTextColor,
            }}
          >
            {orderStatusLabels[currentStatus] || currentStatus}
          </span>
        </div>

        {/* Order Info */}
        <div className="p-5 mb-6" style={cardStyle}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p
                className="text-xs font-medium uppercase tracking-wide mb-1"
                style={{ color: labelColor }}
              >
                Order Number
              </p>
              <p
                className="text-sm font-semibold"
                style={{ color: valueColor }}
              >
                {orderNumber}
              </p>
            </div>
            <div>
              <p
                className="text-xs font-medium uppercase tracking-wide mb-1"
                style={{ color: labelColor }}
              >
                Tracking Number
              </p>
              <p
                className="text-sm font-semibold font-mono"
                style={{ color: valueColor }}
              >
                {trackingNumber}
              </p>
            </div>
            {showEstimatedDelivery && (
              <div>
                <p
                  className="text-xs font-medium uppercase tracking-wide mb-1"
                  style={{ color: labelColor }}
                >
                  Estimated Delivery
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: activeStepColor }}
                >
                  {estimatedDelivery}
                </p>
              </div>
            )}
            <div>
              <p
                className="text-xs font-medium uppercase tracking-wide mb-1"
                style={{ color: labelColor }}
              >
                Total
              </p>
              <p
                className="text-sm font-semibold"
                style={{ color: valueColor }}
              >
                ${orderTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-6 mb-6" style={cardStyle}>
          <h2
            className="text-lg font-bold mb-6"
            style={{ color: titleColor }}
          >
            Tracking Progress
          </h2>
          {layoutMode === "horizontal" ? (
            <HorizontalTimeline
              steps={steps}
              activeStepIdx={activeStepIdx}
              completedStepColor={completedStepColor}
              activeStepColor={activeStepColor}
              pendingStepColor={pendingStepColor}
              valueColor={valueColor}
              labelColor={labelColor}
            />
          ) : (
            <VerticalTimeline
              steps={steps}
              activeStepIdx={activeStepIdx}
              completedStepColor={completedStepColor}
              activeStepColor={activeStepColor}
              pendingStepColor={pendingStepColor}
              valueColor={valueColor}
              labelColor={labelColor}
            />
          )}
        </div>

        {/* Shipping & Carrier */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {showShippingAddress && (
            <div className="p-5" style={cardStyle}>
              <h3
                className="text-sm font-bold mb-3"
                style={{ color: titleColor }}
              >
                {shippingTitle}
              </h3>
              <div className="space-y-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: valueColor }}
                >
                  {shippingName}
                </p>
                <p className="text-sm" style={{ color: labelColor }}>
                  {shippingAddress}
                </p>
                <p className="text-sm" style={{ color: labelColor }}>
                  {shippingCity}, {shippingState} {shippingZip}
                </p>
                <p className="text-sm" style={{ color: labelColor }}>
                  {shippingCountry}
                </p>
              </div>
            </div>
          )}
          {showCarrierInfo && (
            <div className="p-5" style={cardStyle}>
              <h3
                className="text-sm font-bold mb-3"
                style={{ color: titleColor }}
              >
                {carrierTitle}
              </h3>
              <div className="flex items-center gap-3 mb-3">
                {carrierLogo ? (
                  <img
                    src={carrierLogo}
                    alt={carrierName}
                    className="w-10 h-10 object-contain rounded"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: statusBadgeColor,
                      color: statusBadgeTextColor,
                    }}
                  >
                    {carrierName.slice(0, 3).toUpperCase()}
                  </div>
                )}
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: valueColor }}
                  >
                    {carrierName}
                  </p>
                  <p className="text-xs font-mono" style={{ color: labelColor }}>
                    {trackingNumber}
                  </p>
                </div>
              </div>
              <button
                className="text-xs font-medium hover:underline"
                style={{ color: activeStepColor }}
              >
                Track on {carrierName} website →
              </button>
            </div>
          )}
        </div>

        {/* Order Items */}
        {showItemsSummary && (
          <div className="p-5 mt-6" style={cardStyle}>
            <h3
              className="text-sm font-bold mb-4"
              style={{ color: titleColor }}
            >
              {itemsSummaryTitle} ({items.length})
            </h3>
            <div className="divide-y" style={{ borderColor }}>
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: valueColor }}
                    >
                      {item.name}
                    </p>
                    <p className="text-xs" style={{ color: labelColor }}>
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: valueColor }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <div
              className="flex justify-between items-center pt-3 mt-2"
              style={{ borderTop: `1px solid ${borderColor}` }}
            >
              <span className="text-sm font-bold" style={{ color: titleColor }}>
                Total
              </span>
              <span className="text-sm font-bold" style={{ color: titleColor }}>
                ${orderTotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Contact Support */}
        {showContactSupport && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm" style={{ color: labelColor }}>
              Need help with your order?
            </p>
            <button
              className="px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: buttonBackgroundColor,
                color: buttonTextColor,
                borderRadius: `${buttonBorderRadius}px`,
              }}
            >
              {contactButtonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackingLayout;

(OrderTrackingLayout as any).craft = {
  displayName: "Order Tracking",
  props: orderTrackingCraftProps,
  related: { settings: OrderTrackingLayoutSettings },
  rules: defaultCraftRules,
};

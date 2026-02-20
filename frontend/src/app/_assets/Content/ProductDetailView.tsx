"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Button } from "../../design/_designComponents/Button/Button";
import { Section } from "../../design/_designComponents/Section/Section";
import { TemplateEntry } from "../_types";

export const ProductDetailView: TemplateEntry = {
  label: "Product Detail View",
  description: "Modern product detail layout with image gallery and info panel.",
  preview: "🛒 Product Detail",
  category: "content",
  element: (
    <Element
      is={Section as any}
      canvas
      background="#e8e8e8"
      padding={0}
      width="100%"
      minHeight="100vh"
      justifyContent="center"
      alignItems="center"
    >
      <Element
        is={Container as any}
        canvas
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        width="100%"
        minHeight="600px"
        background="transparent"
        gap={0}
      >
        {/* Left: Image Gallery */}
        <Element
          is={Container as any}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          background="#fff"
          width="50%"
          minHeight="600px"
          padding={0}
          style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}
        >
          <img
            src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80"
            alt="Product Main"
            style={{
              width: "80%",
              height: "400px",
              objectFit: "cover",
              borderRadius: 12,
              margin: "40px 0 24px 0",
              background: "#d9d9d9",
              boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
              display: "block",
            }}
          />
          <Element
            is={Container as any}
            flexDirection="row"
            gap={12}
            alignItems="center"
            justifyContent="center"
            background="transparent"
            marginBottom={40}
          >
            {[1, 2, 3, 4].map((i) => (
              <img
                key={i}
                src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=200&q=80"
                alt={`Thumb ${i}`}
                style={{
                  width: 64,
                  height: 64,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: i === 1 ? "2px solid #333" : "2px solid #ccc",
                  background: "#d9d9d9",
                  cursor: "pointer",
                }}
              />
            ))}
          </Element>
        </Element>
        {/* Right: Product Info */}
        <Element
          is={Container as any}
          flexDirection="column"
          alignItems="flex-start"
          justifyContent="center"
          background="#fff"
          width="50%"
          minHeight="600px"
          paddingLeft={60}
          paddingRight={60}
          paddingTop={60}
          paddingBottom={60}
          style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}
        >
          <Text
            text="Product Name"
            fontSize={36}
            fontWeight="700"
            color="#18181b"
            marginBottom={12}
          />
          <Text
            text="★★★★★  12 Reviews  |  6.2K Ratings"
            fontSize={15}
            fontWeight="400"
            color="#333"
            marginBottom={18}
          />
          <Element
            is={Container as any}
            flexDirection="row"
            alignItems="stretch"
            gap={0}
            background="#bdb8b8"
            borderRadius={0}
            paddingLeft={32}
            paddingRight={32}
            paddingTop={20}
            paddingBottom={20}
            width="calc(100% - 64px)"
            marginBottom={18}
            style={{ position: "relative", minHeight: 100, maxWidth: 740, margin: "0 auto" }}
          >
            {/* Left: Main Price */}
            <Element
              is={Container as any}
              flexDirection="column"
              alignItems="flex"
              justifyContent="center"
              background="transparent"
              style={{ minWidth: 180, maxWidth: 220 }}
            >
              <Text
                text="₱ 1,000 -"
                fontSize={32}
                fontWeight="700"
                color="#111"
                marginBottom={0}
                lineHeight={1.1}
              />
              <Text
                text="₱ 1,500"
                fontSize={32}
                fontWeight="700"
                color="#111"
                marginTop={-4}
                lineHeight={1.1}
              />
            </Element>
            {/* Middle: Old Price */}
            <Element
              is={Container as any}
              flexDirection="column"
              alignItems="flex"
              justifyContent="center"
              background="transparent"
              style={{ minWidth: 120, maxWidth: 160, marginLeft: 24 }}
            >
              <Text
                text="₱ 2,000 -"
                fontSize={16}
                fontWeight="400"
                color="#888"
                marginBottom={0}
                lineHeight={1.1}
              />
              <Text
                text="₱ 3,500"
                fontSize={16}
                fontWeight="400"
                color="#888"
                marginTop={-4}
                lineHeight={1.1}
              />
            </Element>
            {/* Right: Discount */}
            <Element
              is={Container as any}
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              background="#fff"
              borderRadius={4}
              paddingLeft={0}
              paddingRight={0}
              paddingTop={0}
              paddingBottom={0}
              style={{ flex: 1, marginLeft: 32, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 48, maxHeight: 56, minWidth: 180 }}
            >
              <Text
                text="-51%"
                fontSize={20}
                fontWeight="700"
                color="#111"
                textAlign="center"
              />
            </Element>
          </Element>
          <Text
            text="Shipping: Guaranteed to get by 23 - 24 Feb > Free shipping. Get a ₱50 voucher if your order arrives late."
            fontSize={13}
            fontWeight="400"
            color="#444"
            marginBottom={10}
          />
          <Text
            text="Shopping Guarantee: Free & Easy Returns • Merchandise Protection"
            fontSize={13}
            fontWeight="400"
            color="#444"
            marginBottom={18}
          />
          <Element
            is={Container as any}
            flexDirection="row"
            alignItems="center"
            gap={12}
            background="transparent"
            marginBottom={18}
          >
            <Text
              text="Volume"
              fontSize={15}
              fontWeight="600"
              color="#222"
            />
            {["10 ml", "20 ml", "50 ml"].map((vol, idx) => (
              <Button
                key={vol}
                label={`🧴 ${vol}`}
                backgroundColor={idx === 0 ? "#333" : "#fff"}
                textColor={idx === 0 ? "#fff" : "#333"}
                fontSize={13}
                fontWeight="500"
                paddingTop={7}
                paddingBottom={7}
                paddingLeft={14}
                paddingRight={14}
                borderRadius={6}
              />
            ))}
          </Element>
          <Element
            is={Container as any}
            flexDirection="row"
            alignItems="center"
            gap={12}
            background="transparent"
            marginBottom={18}
          >
            <Text
              text="Quantity"
              fontSize={15}
              fontWeight="600"
              color="#222"
            />
            <Button
              label="−"
              backgroundColor="#fff"
              textColor="#333"
              fontSize={18}
              fontWeight="400"
              paddingTop={6}
              paddingBottom={6}
              paddingLeft={14}
              paddingRight={14}
              borderRadius={6}
            />
            <Text
              text="1"
              fontSize={15}
              fontWeight="600"
              color="#222"
              paddingLeft={14}
              paddingRight={14}
            />
            <Button
              label="+"
              backgroundColor="#fff"
              textColor="#333"
              fontSize={18}
              fontWeight="400"
              paddingTop={6}
              paddingBottom={6}
              paddingLeft={14}
              paddingRight={14}
              borderRadius={6}
            />
          </Element>
          <Element
            is={Container as any}
            flexDirection="row"
            gap={14}
            marginTop={8}
            background="transparent"
          >
            <Button
              label="🛒 Add To Cart"
              backgroundColor="#fff"
              textColor="#18181b"
              fontSize={15}
              fontWeight="700"
              borderRadius={8}
              paddingTop={14}
              paddingBottom={14}
              paddingLeft={28}
              paddingRight={28}
            />
            <Button
              label="Buy Now"
              backgroundColor="#18181b"
              textColor="#fff"
              fontSize={15}
              fontWeight="700"
              borderRadius={8}
              paddingTop={14}
              paddingBottom={14}
              paddingLeft={36}
              paddingRight={36}
            />
          </Element>
        </Element>
      </Element>
    </Element>
  ),
};
"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const BrandFooter: TemplateEntry = {
  label: "Brand Footer",
  description: "Logo + brand story with social links",
  preview: "✨",
  element: React.createElement(
    Element as any,
    { is: Section, canvas: true, background: "#0a1929", customStyle: { padding: "0" } },
    React.createElement(
      Element as any,
      { is: Container, padding: "64px 24px 32px", canvas: true },
      React.createElement(
        Element as any,
        { is: Row, gap: 48, canvas: true },
        // Brand story column
        React.createElement(
          Element as any,
          { is: Column, width: "40%", canvas: true },
          React.createElement(Text, { 
            text: "HERITAGE", 
            fontSize: 28, 
            fontWeight: "700", 
            color: "#ffffff",
            letterSpacing: "4px",
            marginBottom: 20,
            fontFamily: "serif"
          }),
          React.createElement(Text, { 
            text: "Est. 2014", 
            fontSize: 12, 
            color: "#94a3b8",
            marginBottom: 20,
            letterSpacing: "2px"
          }),
          React.createElement(Text, { 
            text: "We started with a simple mission: to create timeless pieces that blend craftsmanship with modern design. Every product tells a story of quality, sustainability, and passion for excellence.", 
            fontSize: 14, 
            color: "#cbd5e1",
            lineHeight: "1.8",
            marginBottom: 24
          }),
          // Social links
          React.createElement(Text, { 
            text: "Connect with us", 
            fontSize: 14, 
            fontWeight: "600", 
            color: "#ffffff",
            marginBottom: 16
          }),
          React.createElement(
            Element as any,
            { is: Row, gap: 20, canvas: true },
            React.createElement(
              Element as any,
              { is: Container, background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", canvas: true },
              React.createElement(Text, { text: "📘", fontSize: 20 })
            ),
            React.createElement(
              Element as any,
              { is: Container, background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", canvas: true },
              React.createElement(Text, { text: "🐦", fontSize: 20 })
            ),
            React.createElement(
              Element as any,
              { is: Container, background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", canvas: true },
              React.createElement(Text, { text: "📷", fontSize: 20 })
            ),
            React.createElement(
              Element as any,
              { is: Container, background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", canvas: true },
              React.createElement(Text, { text: "🎨", fontSize: 20 })
            ),
            React.createElement(
              Element as any,
              { is: Container, background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", canvas: true },
              React.createElement(Text, { text: "📱", fontSize: 20 })
            )
          )
        ),
        
        // Quick links
        React.createElement(
          Element as any,
          { is: Column, width: "15%", canvas: true },
          React.createElement(Text, { text: "Shop", fontSize: 16, fontWeight: "600", color: "#ffffff", marginBottom: 24 }),
          React.createElement(Text, { text: "New Arrivals", fontSize: 14, color: "#94a3b8", marginBottom: 16 }),
          React.createElement(Text, { text: "Best Sellers", fontSize: 14, color: "#94a3b8", marginBottom: 16 }),
          React.createElement(Text, { text: "Limited Edition", fontSize: 14, color: "#94a3b8", marginBottom: 16 }),
          React.createElement(Text, { text: "Sale", fontSize: 14, color: "#94a3b8", marginBottom: 16 })
        ),
        
        React.createElement(
          Element as any,
          { is: Column, width: "15%", canvas: true },
          React.createElement(Text, { text: "About", fontSize: 16, fontWeight: "600", color: "#ffffff", marginBottom: 24 }),
          React.createElement(Text, { text: "Our Story", fontSize: 14, color: "#94a3b8", marginBottom: 16 }),
          React.createElement(Text, { text: "Craftsmanship", fontSize: 14, color: "#94a3b8", marginBottom: 16 }),
          React.createElement(Text, { text: "Sustainability", fontSize: 14, color: "#94a3b8", marginBottom: 16 }),
          React.createElement(Text, { text: "Press", fontSize: 14, color: "#94a3b8", marginBottom: 16 })
        ),
        
        React.createElement(
          Element as any,
          { is: Column, width: "15%", canvas: true },
          React.createElement(Text, { text: "Support", fontSize: 16, fontWeight: "600", color: "#ffffff", marginBottom: 24 }),
          React.createElement(Text, { text: "FAQ", fontSize: 14, color: "#94a3b8", marginBottom: 16 }),
          React.createElement(Text, { text: "Shipping", fontSize: 14, color: "#94a3b8", marginBottom: 16 }),
          React.createElement(Text, { text: "Returns", fontSize: 14, color: "#94a3b8", marginBottom: 16 }),
          React.createElement(Text, { text: "Size Guide", fontSize: 14, color: "#94a3b8", marginBottom: 16 })
        ),
        
        React.createElement(
          Element as any,
          { is: Column, width: "15%", canvas: true },
          React.createElement(Text, { text: "Contact", fontSize: 16, fontWeight: "600", color: "#ffffff", marginBottom: 24 }),
          React.createElement(Text, { text: "Email Us", fontSize: 14, color: "#94a3b8", marginBottom: 16 }),
          React.createElement(Text, { text: "Visit Store", fontSize: 14, color: "#94a3b8", marginBottom: 16 }),
          React.createElement(Text, { text: "Careers", fontSize: 14, color: "#94a3b8", marginBottom: 16 }),
          React.createElement(Text, { text: "Affiliates", fontSize: 14, color: "#94a3b8", marginBottom: 16 })
        )
      ),
      
      // Copyright and awards
      React.createElement(
        Element as any,
        { is: Row, justifyContent: "space-between", alignItems: "center", padding: "32px 0 0", borderTop: "1px solid #1e293b", marginTop: 48, canvas: true },
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(Text, { text: "© 2024 Heritage Brand. All rights reserved.", fontSize: 12, color: "#64748b" })
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(
            Element as any,
            { is: Row, gap: 24, canvas: true },
            React.createElement(Text, { text: "🏆 Design Award 2024", fontSize: 12, color: "#94a3b8" }),
            React.createElement(Text, { text: "🌱 B Corp Certified", fontSize: 12, color: "#94a3b8" })
          )
        )
      )
    )
  ),
  category: "footer",
};
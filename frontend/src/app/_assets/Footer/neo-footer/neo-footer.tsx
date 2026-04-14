"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Text } from "../../../design/_designComponents/Text/Text";
import { TemplateEntry } from "../../_types";

export const NeoFooter: TemplateEntry = {
  label: "Neo Footer",
  description: "High-fidelity Finding Neo branded footer",
  preview: null,
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      width: "100%",
      background: "#0d2c25",
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      canvas: true,
      alignItems: "center",
      justifyContent: "center",
      isFreeform: false,
      position: "relative",
      zIndex: 0,
      overflow: "hidden",
    },
    // Background Decoration 1
    React.createElement(Element as any, {
      is: Container as any,
      background: "transparent",
      padding: 0,
      width: "1000px",
      height: "1000px",
      borderColor: "rgba(255,255,255,0.05)",
      borderWidth: 1,
      position: "absolute",
      top: "-200px",
      right: "-200px",
      rotation: 45,
      canvas: true,
    }),
    // Background Decoration 2
    React.createElement(Element as any, {
      is: Container as any,
      background: "transparent",
      padding: 0,
      width: "800px",
      height: "800px",
      borderColor: "rgba(255,255,255,0.03)",
      borderWidth: 1,
      position: "absolute",
      bottom: "-300px",
      left: "20%",
      rotation: -45,
      canvas: true,
    }),
    // Main Content (Iz1iaUPk9U)
    React.createElement(
      Element as any,
      {
        is: Container as any,
        background: "transparent",
        paddingTop: 120, // Reverted to exact user structure
        paddingRight: 80,
        paddingBottom: 80,
        paddingLeft: 80,
        height: "auto",
        maxWidth: "1380px",
        position: "relative",
        zIndex: 10,
        canvas: true,
        alignItems: "stretch",
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          flexWrap: "nowrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 60,
          canvas: true,
        },
        // Column 1 (gEou-EoA3O)
        React.createElement(
          Element as any,
          {
            is: Column as any,
            padding: 0,
            width: "50%",
            gap: 0,
            canvas: true,
          },
          // Logo Row (ISZKU-wllA)
          React.createElement(
            Element as any,
            { is: Row as any, marginBottom: 48, alignItems: "center", flexWrap: "nowrap", canvas: true },
            React.createElement(
              Element as any,
              { is: Container as any, width: "54px", height: "54px", background: "transparent", canvas: true, alignItems: "center", justifyContent: "center", position: "relative" },
              React.createElement(
                Element as any,
                { is: Column as any, width: "18px", height: "14px", alignItems: "center", justifyContent: "center", gap: 3, position: "absolute", bottom: "12px", canvas: true },
                React.createElement(Element as any, { is: Container as any, background: "#ffffff", height: "2px", width: "100%", canvas: true }),
                React.createElement(Element as any, { is: Container as any, background: "#ffffff", height: "2px", width: "100%", canvas: true }),
                React.createElement(Element as any, { is: Container as any, background: "#ffffff", height: "2px", width: "100%", canvas: true })
              )
            ),
            React.createElement(Text as any, { text: "FINDING NEO", fontSize: 32, fontFamily: "Outfit", fontWeight: "600", letterSpacing: "5px", color: "#ffffff", position: "relative", left: "-47px", marginLeft: -18.37 })
          ),
          // Tagline (Qd6LkO7AQH)
          React.createElement(Text as any, { text: "Empowering physicians with advanced multi-modal tools to improve treatment selection and patient outcomes.", fontSize: 22, fontFamily: "Outfit", color: "#ffffff", lineHeight: 1.6, width: "90%", marginBottom: 64 }),
          // Socials Row (q4rBo25e5Q)
          React.createElement(
            Element as any,
            { is: Row as any, marginBottom: 80, alignItems: "center", canvas: true },
            ...["𝕏", "in", "📷", "fb"].map((sym) =>
              React.createElement(
                Element as any,
                { is: Container as any, width: "48px", height: "auto", background: "transparent", marginRight: 24, canvas: true, alignItems: "center", justifyContent: "center" },
                React.createElement(Text as any, { text: sym, fontSize: 24, fontFamily: "Outfit", color: "#ffffff", fontWeight: "500" })
              )
            )
          ),
          // Button (dLWvpzmcZa)
          React.createElement(
            Element as any,
            { is: Container as any, width: "184px", height: "68px", background: "transparent", borderWidth: 1, borderColor: "#ffffff", canvas: true, alignItems: "center", justifyContent: "center", cursor: "pointer" },
            React.createElement(
              Element as any,
              { is: Row as any, gap: 12, alignItems: "center", justifyContent: "center", canvas: true },
              React.createElement(Text as any, { text: "︿", fontSize: 20, fontFamily: "Outfit", fontWeight: "900", color: "#ffffff", position: "relative", top: "-4px" }),
              React.createElement(Text as any, { text: "BACK TO TOP", fontSize: 14, fontFamily: "Outfit", fontWeight: "700", letterSpacing: "3px", color: "#ffffff" })
            )
          )
        ),
        // Column 2 & 3: Navs (uAMlr7n-v2)
        React.createElement(
          Element as any,
          { is: Row as any, width: "45%", alignItems: "flex-start", justifyContent: "flex-end", gap: 100, canvas: true },
          // Site Map (ZkAS6taqaD)
          React.createElement(
            Element as any,
            { is: Column as any, width: "auto", canvas: true },
            React.createElement(Text as any, { text: "Site Map", fontSize: 18, fontFamily: "Outfit", fontWeight: "700", letterSpacing: "1px", color: "#ffffff", marginBottom: 40 }),
            ...["Homepage", "Technology", "Techneo", "Resources & news", "Careers", "Contact Us", "Portal"].map((link) =>
              React.createElement(Text as any, { text: link, fontFamily: "Outfit", color: "#cbd5e1", lineHeight: 1.4, marginBottom: 24, textDecoration: link === "Homepage" ? "underline" : "none" })
            )
          ),
          // Legal (-YgT477JAX)
          React.createElement(
            Element as any,
            { is: Column as any, width: "auto", canvas: true },
            React.createElement(Text as any, { text: "Legal", fontSize: 18, fontFamily: "Outfit", fontWeight: "700", letterSpacing: "1px", color: "#ffffff", marginBottom: 40 }),
            ...["Privacy Policy", "Terms of Services", "Lawyers Corner"].map((link) =>
              React.createElement(Text as any, { text: link, fontFamily: "Outfit", color: "#cbd5e1", lineHeight: 1.4, marginBottom: 24 })
            )
          )
        )
      )
    ),
    // Copyright Bar (dvMf_hh5dR)
    React.createElement(
      Element as any,
      { is: Container as any, width: "100%", background: "#d2983b", padding: 0, paddingTop: 16, paddingBottom: 16, canvas: true, alignItems: "center", justifyContent: "center", zIndex: 20 },
      React.createElement(Text as any, { text: "Copyright © 2026, Finding Neo, All Rights Reserved.", fontSize: 14, fontFamily: "Outfit", fontWeight: "500", color: "#000000" })
    )
  ),
  category: "footer",
};

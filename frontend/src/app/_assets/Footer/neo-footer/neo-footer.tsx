"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Text } from "../../../design/_designComponents/Text/Text";
import { TemplateEntry } from "../../_types";

// Helper for Footer Links
function footerLink(text: string, isUnderlined: boolean = false) {
  return React.createElement(Text as any, {
    text,
    fontSize: 16,
    fontFamily: "Outfit",
    color: "#cbd5e1",
    marginBottom: 24,
    lineHeight: 1.4,
    textDecoration: isUnderlined ? "underline" : "none",
    fontWeight: "400",
  });
}

// Social Icon helper
function socialIcon(symbol: string) {
  return React.createElement(
    Element as any,
    {
      is: Container as any,
      width: "48px",
      height: "auto",
      background: "transparent",
      borderRadius: 0,
      padding: 0,
      canvas: true,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 24,
    },
    React.createElement(Text as any, {
      text: symbol,
      fontSize: 24,
      fontFamily: "Outfit",
      color: "#ffffff",
      fontWeight: "500",
    })
  );
}

export const NeoFooter: TemplateEntry = {
  label: "Neo Footer",
  description: "High-fidelity Finding Neo branded footer",
  preview: "Neo",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      width: "100%",
      background: "#0d2c25",
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      canvas: true,
      height: "auto",
      isFreeform: false,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
    },
    // BACKGROUND V-SHAPE DECORATIONS
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "1000px",
        height: "1000px",
        background: "transparent",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
        position: "absolute",
        top: "-200px",
        right: "-200px",
        rotation: 45,
        canvas: true,
      }
    ),
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "800px",
        height: "800px",
        background: "transparent",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.03)",
        position: "absolute",
        bottom: "-300px",
        left: "20%",
        rotation: -45,
        canvas: true,
      }
    ),
    
    // CONTENT CONTAINER
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        maxWidth: "1380px",
        background: "transparent",
        paddingTop: 120,
        paddingBottom: 80,
        paddingLeft: 80,
        paddingRight: 80,
        canvas: true,
        height: "auto",
        alignItems: "stretch",
        justifyContent: "flex-start",
        position: "relative",
        zIndex: 10,
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          gap: 60,
          flexWrap: "nowrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          height: "auto",
        },
        
        // LEFT: Branding & Socials
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "50%",
            padding: 0,
            gap: 0,
            canvas: true,
            alignItems: "flex-start",
            height: "auto",
          },
          // Logo
          React.createElement(
            Element as any,
            {
              is: Row as any,
              canvas: true,
              gap: 16,
              flexWrap: "nowrap",
              alignItems: "center",
              justifyContent: "flex-start",
              marginBottom: 48,
              height: "auto",
            },
            React.createElement(
              Element as any,
              {
                is: Container as any,
                width: "54px",
                height: "54px",
                background: "transparent",
                canvas: true,
                position: "relative",
                alignItems: "center",
                justifyContent: "center",
              },
              React.createElement(Text as any, {
                text: "▲",
                fontSize: 60,
                fontFamily: "Outfit",
                color: "#d2983b",
                fontWeight: "700",
                position: "absolute",
                zIndex: 2,
              }),
              React.createElement(
                Element as any,
                {
                  is: Column as any,
                  width: "18px",
                  height: "14px",
                  position: "absolute",
                  bottom: "12px",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  canvas: true,
                },
                React.createElement(Container as any, { width: "100%", height: "2px", background: "#0d2c25" }),
                React.createElement(Container as any, { width: "100%", height: "2px", background: "#0d2c25" }),
                React.createElement(Container as any, { width: "100%", height: "2px", background: "#0d2c25" })
              )
            ),
            React.createElement(Text as any, {
              text: "FINDING NEO",
              fontSize: 32,
              fontFamily: "Outfit",
              color: "#ffffff",
              fontWeight: "600",
              letterSpacing: "5px",
            })
          ),
          
          React.createElement(Text as any, {
            text: "Empowering physicians with advanced multi-modal tools to improve treatment selection and patient outcomes.",
            fontSize: 22,
            fontFamily: "Outfit",
            color: "#ffffff",
            marginBottom: 64,
            lineHeight: 1.6,
            width: "90%",
            fontWeight: "400",
          }),
          
          // Socials
          React.createElement(
            Element as any,
            {
              is: Row as any,
              canvas: true,
              gap: 0,
              flexWrap: "nowrap",
              alignItems: "center",
              justifyContent: "flex-start",
              marginBottom: 80,
              height: "auto",
            },
            socialIcon("𝕏"),
            socialIcon("in"),
            socialIcon("📷"),
            socialIcon("fb")
          ),
          
          // Back to Top
          React.createElement(
            Element as any,
            {
              is: Container as any,
              borderWidth: 1,
              borderColor: "#ffffff",
              background: "transparent",
              paddingTop: 18,
              paddingBottom: 18,
              paddingLeft: 32,
              paddingRight: 32,
              canvas: true,
              alignItems: "center",
              justifyContent: "center",
              height: "auto",
              cursor: "pointer",
            },
            React.createElement(
              Element as any,
              {
                is: Row as any,
                canvas: true,
                gap: 12,
                alignItems: "center",
                justifyContent: "center",
                height: "auto",
              },
              React.createElement(Text as any, {
                text: "︿",
                fontSize: 20,
                fontFamily: "Outfit",
                color: "#ffffff",
                fontWeight: "900",
              }),
              React.createElement(Text as any, {
                text: "BACK TO TOP",
                fontSize: 14,
                fontFamily: "Outfit",
                color: "#ffffff",
                fontWeight: "700",
                letterSpacing: "3px",
              })
            )
          )
        ),
        
        // RIGHT: Links
        React.createElement(
          Element as any,
          {
            is: Row as any,
            width: "45%",
            padding: 0,
            gap: 100,
            canvas: true,
            alignItems: "flex-start",
            justifyContent: "flex-end",
            height: "auto",
          },
          // Column 1
          React.createElement(
            Element as any,
            {
              is: Column as any,
              width: "auto",
              padding: 0,
              gap: 0,
              canvas: true,
              alignItems: "flex-start",
              height: "auto",
            },
            React.createElement(Text as any, {
              text: "Site Map",
              fontSize: 18,
              fontFamily: "Outfit",
              color: "#ffffff",
              fontWeight: "700",
              marginBottom: 40,
              letterSpacing: "1px",
            }),
            footerLink("Homepage", true),
            footerLink("Technology"),
            footerLink("Techneo"),
            footerLink("Resources & news"),
            footerLink("Careers"),
            footerLink("Contact Us"),
            footerLink("Portal")
          ),
          // Column 2
          React.createElement(
            Element as any,
            {
              is: Column as any,
              width: "auto",
              padding: 0,
              gap: 0,
              canvas: true,
              alignItems: "flex-start",
              height: "auto",
            },
            React.createElement(Text as any, {
              text: "Legal",
              fontSize: 18,
              fontFamily: "Outfit",
              color: "#ffffff",
              fontWeight: "700",
              marginBottom: 40,
              letterSpacing: "1px",
            }),
            footerLink("Privacy Policy"),
            footerLink("Terms of Services"),
            footerLink("Lawyer's Corners")
          )
        )
      )
    ),
    
    // COPYRIGHT BAR
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        background: "#d2983b",
        paddingTop: 16,
        paddingBottom: 16,
        canvas: true,
        alignItems: "center",
        justifyContent: "center",
        height: "auto",
        zIndex: 20,
      },
      React.createElement(Text as any, {
        text: "Copyright © 2024, Finding Neo, All Rights Reserved.",
        fontSize: 14,
        fontFamily: "Outfit",
        color: "#000000",
        fontWeight: "500",
      })
    )
  ),
  category: "footer",
};

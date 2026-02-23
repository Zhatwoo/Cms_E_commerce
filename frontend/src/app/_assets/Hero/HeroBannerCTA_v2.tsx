"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Text } from "../../design/_designComponents/Text/Text";
import { Button } from "../../design/_designComponents/Button/Button";
import { Section } from "../../design/_designComponents/Section/Section";
import { Column } from "../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../_types";

export const HeroBannerCTA_v2: TemplateEntry = {
    label: "Hero Banner CTA v2",
    description: "Elegant centered hero with serif typography",
    preview: "🎞️ Hero v2",
    element: React.createElement(
        Element as any,
        {
            is: Section as any,
            canvas: true,
            padding: 0,
            paddingTop: 0,
            paddingRight: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            backgroundImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2099&auto=format&fit=crop", // Elegant lifestyle/product background
            backgroundOverlay: "rgba(255,255,255,0.2)", // Subtle light overlay
            backgroundSize: "cover",
            backgroundPosition: "center",
            width: "100%",
            minHeight: "500px"
        },
        React.createElement(
            Element as any,
            {
                is: Column as any,
                padding: 140,
                paddingTop: 140,
                paddingRight: 140,
                paddingBottom: 140,
                paddingLeft: 140,
                canvas: true,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center", // Centered for v2
                gap: 20,
                width: "100%",
                minHeight: "500px"
            },
            React.createElement(
                Element as any,
                {
                    is: Column as any,
                    canvas: true,
                    alignItems: "center",
                    gap: 0
                },
                React.createElement(Text as any, {
                    text: "Lorem Ipsum Generator",
                    fontSize: 28,
                    fontWeight: "500",
                    fontFamily: "Georgia, serif",
                    color: "#000000",
                    textAlign: "center"
                }),
                React.createElement(Text as any, {
                    text: "ParagraphsSentencesWordsCopy",
                    fontSize: 42,
                    fontWeight: "700",
                    fontFamily: "Georgia, serif",
                    color: "#000000",
                    textAlign: "center",
                    marginTop: -10
                })
            ),
            React.createElement(Button as any, {
                label: "BUY NOW",
                backgroundColor: "#000000",
                textColor: "#ffffff",
                fontSize: 14,
                fontWeight: "700",
                paddingTop: 16,
                paddingBottom: 16,
                paddingLeft: 40,
                paddingRight: 40,
                borderRadius: 0, // Rectangular from image
                letterSpacing: 2
            })
        )
    ),
    category: "hero",
};

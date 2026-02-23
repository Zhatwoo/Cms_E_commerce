"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Button } from "../../design/_designComponents/Button/Button";
import { Section } from "../../design/_designComponents/Section/Section";
import { TemplateEntry } from "../_types";

export const HeroBannerCTA_v3: TemplateEntry = {
    label: "Hero Banner CTA v3",
    description: "Hero with floating white card on the right",
    preview: "🎞️ Hero v3",
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
            background: "#23272f", // Slightly darker for more contrast
            width: "100%",
            minHeight: "520px"
        },
        React.createElement(
            Element as any,
            {
                is: Container as any,
                backgroundImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2099&auto=format&fit=crop",
                backgroundSize: "cover",
                backgroundPosition: "center",
                padding: 25,
                canvas: true,
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
                width: "100%",
                minHeight: "520px"
            },
            React.createElement(
                Element as any,
                {
                    is: Container as any,
                    background: "#fff",
                    padding: 0,
                    paddingTop: 52,
                    paddingRight: 52,
                    paddingBottom: 52,
                    paddingLeft: 52,
                    marginRight: 180, // More space from the right edge
                    marginTop: 52, // Add top margin for floating effect
                    marginBottom: 52, // Add bottom margin for floating effect
                    canvas: true,
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 28,
                    width: "360px",
                    minHeight: "auto",
                    borderRadius: 16,
                    boxShadow: "0 24px 40px -8px rgba(0,0,0,0.18), 0 1.5px 4px rgba(0,0,0,0.08)"
                },
                React.createElement(
                    Element as any,
                    {
                        is: Container as any,
                        canvas: true,
                        alignItems: "center",
                        gap: 10,
                        background: "transparent"
                    },
                    React.createElement(Text as any, {
                        text: "Lorem Ipsum Generator",
                        fontSize: 24,
                        fontWeight: "600",
                        fontFamily: "Georgia, serif",
                        color: "#18181b",
                        textAlign: "center"
                    }),
                    React.createElement(Text as any, {
                        text: "Paragraphs • Sentences • Words • Copy",
                        fontSize: 16,
                        fontWeight: "400",
                        fontFamily: "Georgia, serif",
                        color: "#444",
                        textAlign: "center"
                    })
                ),
                React.createElement(Button as any, {
                    label: "WATCH NOW",
                    backgroundColor: "#18181b",
                    textColor: "#fff",
                    fontSize: 14,
                    fontWeight: "800",
                    paddingTop: 18,
                    paddingBottom: 18,
                    paddingLeft: 40,
                    paddingRight: 40,
                    borderRadius: 6,
                    letterSpacing: 1.5,
                    marginTop: 18,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.10)"
                })
            )
        )
    ),
    category: "hero",
};

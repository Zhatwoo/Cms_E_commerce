"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Button } from "../../design/_designComponents/Button/Button";
import { Section } from "../../design/_designComponents/Section/Section";
import { Column } from "../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../_types";

export const HeroBannerCTA: TemplateEntry = {
    label: "Hero Banner CTA",
    description: "Classic gray hero banner with title and navigation",
    preview: "🎞️ Hero",
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
            backgroundImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
            backgroundOverlay: "rgba(0,0,0,0.5)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            width: "100%",
            minHeight: "450px"
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
                alignItems: "flex-start",
                gap: 12,
                width: "100%",
                minHeight: "450px"
            },
            React.createElement(Text as any, {
                text: "Title",
                fontSize: 80,
                fontWeight: "700",
                color: "#ffffff"
            }),
            React.createElement(Text as any, {
                text: "Lorem ipsum dolor sit amet,\nconsectetur adipiscing elit",
                fontSize: 26,
                color: "#dbdbdb",
                marginBottom: 20
            }),
            React.createElement(Button as any, {
                label: "Navigation     →",
                backgroundColor: "#1a1a1a", // Deep black button
                textColor: "#ffffff",
                fontSize: 16,
                fontWeight: "600",
                paddingTop: 16,
                paddingBottom: 16,
                paddingLeft: 22,
                paddingRight: 22,
                borderRadius: 10
            })
        )
    ),
    category: "hero",
};

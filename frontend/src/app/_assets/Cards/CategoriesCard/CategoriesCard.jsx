"use client";
import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";

const categories = [
  { label: "Men's Apparel", img: "/img/categories/mens-apparel.jpg" },
  { label: "Women's Apparel", img: "/img/categories/womens-apparel.jpg" },
  { label: "Mobile & Gadgets", img: "/img/categories/mobile-gadgets.jpg" },
  { label: "Mobile Accessories", img: "/img/categories/mobile-accessories.jpg" },
  { label: "Home Entertainment", img: "/img/categories/home-entertainment.jpg" },
  { label: "Computers & Laptops", img: "/img/categories/computers-laptops.jpg" },
  { label: "Home & Living", img: "/img/categories/home-living.jpg" },
  { label: "Sports & Outdoors", img: "/img/categories/sports-outdoors.jpg" },
  { label: "Beauty & Health", img: "/img/categories/beauty-health.jpg" },
  { label: "Toys & Kids", img: "/img/categories/toys-kids.jpg" },
  { label: "Books & Stationery", img: "/img/categories/books-stationery.jpg" },
  { label: "Pet Supplies", img: "/img/categories/pet-supplies.jpg" },
  { label: "Automotive", img: "/img/categories/automotive.jpg" },
  { label: "Groceries", img: "/img/categories/groceries.jpg" },
  { label: "Music & Instruments", img: "/img/categories/music-instruments.jpg" },
  { label: "Travel & Luggage", img: "/img/categories/travel-luggage.jpg" },
];

export const CategoriesCard = {
  label: "Categories Card",
  description: "E-commerce categories card with modern UI",
  preview: "📦",
  element: React.createElement(
    Element,
    {
      is: Container,
      background: "#fefefe",
      paddingTop: 32,
      paddingRight: 32,
      paddingBottom: 32,
      paddingLeft: 32,
      borderRadius: 16,
      boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
      borderWidth: 0,
      canvas: true,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      width: "100%",
      maxWidth: 1200,
      margin: "0 auto",
    },
    // Header row
    React.createElement(
      Element,
      {
        is: Container,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: 24,
        canvas: true,
      },
      React.createElement(Text, {
        text: "Shop by Category",
        fontSize: 42,
        fontWeight: "bold",
        color: "#111827", // Darker, modern gray
      }),
      React.createElement(Text, {
        text: "View all →",
        fontSize: 18,
        fontWeight: "600",
        color: "#6366f1", // Soft Indigo accent
        cursor: "pointer",
        hoverColor: "#4f46e5",
      })
    ),
    // Grid of categories
    React.createElement(
      Element,
      {
        is: Container,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 28,
        width: "100%",
        canvas: true,
        alignItems: "stretch",
        justifyItems: "center",
        minHeight: 0,
      },
      ...categories.map((cat, idx) => {
        const unsplashImages = [
          "photo-1556228578-8c89e6adf883",
          "photo-1512436991641-6745cdb1723f",
          "photo-1517336714731-489689fd1ca8",
          "photo-1465101046530-73398c7f28ca",
          "photo-1506744038136-46273834b3fb",
          "photo-1519125323398-675f0ddb6308",
          "photo-1465101178521-c1a9136a3b99",
          "photo-1503342217505-b0a15ec3261c",
          "photo-1515378791036-0648a3ef77b2",
          "photo-1517841905240-472988babdf9",
        ];
        const imageText = cat.label;
        const unsplashId = unsplashImages[idx % unsplashImages.length];
        const unsplashSrc = `https://images.unsplash.com/${unsplashId}?auto=format&fit=crop&w=600&q=80&text=${encodeURIComponent(imageText)}`;

        return React.createElement(
          Element,
          {
            is: Container,
            background: "#ffffff",
            borderRadius: 14,
            boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
            minWidth: 220,
            maxWidth: 340,
            width: "100%",
            cursor: "pointer",
            transition: "transform 0.3s, box-shadow 0.3s",
            hoverTransform: "scale(1.05)",
            hoverBoxShadow: "0 8px 25px rgba(0,0,0,0.12)",
            canvas: true,
          },
          React.createElement(Image, {
            src: unsplashSrc,
            alt: cat.label,
            width: "100%",
            height: 180,
            objectFit: "cover",
            borderRadius: 12,
            marginBottom: 16,
            style: { minHeight: 180, maxHeight: 220, minWidth: 220, maxWidth: 340 },
          }),
          React.createElement(Text, {
            text: cat.label,
            fontSize: 18,
            fontWeight: "600",
            color: "#1f2937",
            align: "center",
            lineHeight: 1.4,
            marginTop: 4,
            style: { wordBreak: "break-word" },
          })
        );
      })
    )
  ),
  category: "card",
};

export default CategoriesCard;
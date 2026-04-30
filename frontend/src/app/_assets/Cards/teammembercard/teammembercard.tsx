"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { useNode } from "@craftjs/core";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Container } from "../../../design/_designComponents/Container/Container";
import { TemplateEntry } from "../../_types";

import { ContainerSettings } from "../../../design/_designComponents/Container/ContainerSettings";
import { ContainerDefaultProps } from "../../../design/_designComponents/Container/Container";

export const TeamMemberCardComp = ({ children, ...props }: any) => {
  return (
    <Container {...props}>
      {children}
    </Container>
  );
};

(TeamMemberCardComp as any).craft = {
  displayName: "Team Member Card",
  props: ContainerDefaultProps,
  related: {
    settings: ContainerSettings,
  },
};

export const TeamMemberCard: TemplateEntry = {
  label: "Team Member Card",
  description: "Profile card for team members",
  preview: "👥",
  category: "card",
  element: React.createElement(
    Element,
    {
      is: TeamMemberCardComp,
      canvas: true,
      background: "#ffffff",
      width: "280px",
      height: "auto",
      paddingTop: 32,
      paddingBottom: 32,
      paddingLeft: 24,
      paddingRight: 24,
      borderRadius: 20,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      borderWidth: 1,
      borderColor: "#f1f5f9",
      borderStyle: "solid",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
    },
    React.createElement(Image as any, {
      src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200",
      alt: "Team Member",
      width: "96px",
      height: "96px",
      objectFit: "cover",
      borderRadius: 9999,
      marginBottom: 0,
      marginTop: 0,
    }),
    React.createElement(Text as any, {
      text: "John Doe",
      fontSize: 18,
      fontWeight: "700",
      color: "#0f172a",
      textAlign: "center",
      width: "auto",
      marginTop: 0,
      marginBottom: 0,
    }),
    React.createElement(Text as any, {
      text: "Web Developer",
      fontSize: 14,
      fontWeight: "600",
      color: "#3b82f6",
      textAlign: "center",
      width: "auto",
      marginTop: 0,
      marginBottom: 0,
    }),
    React.createElement(Text as any, {
      text: "Passionate about creating beautiful and functional user experiences.",
      fontSize: 14,
      fontWeight: "400",
      color: "#64748b",
      textAlign: "center",
      width: "100%",
      lineHeight: 1.6,
      marginTop: 0,
      marginBottom: 0,
    })
  ),
};

export default TeamMemberCard;
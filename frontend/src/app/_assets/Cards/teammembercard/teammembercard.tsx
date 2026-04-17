"use client";

import React from "react";
import { Element, useNode } from "@craftjs/core";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Section } from "../../../design/_designComponents/Section/Section";
import { DesignSection } from "../../../design/_components/rightPanel/settings/DesignSection";
import { TemplateEntry } from "../../_types";

interface TeamMemberCardProps {
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
}

const SpacingRow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-2">{children}</div>
);

const SpacingLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[11px] text-[var(--builder-text-muted)] w-24 shrink-0">{children}</span>
);

export function TeamMemberCardCanvas({
  paddingTop = 28,
  paddingRight = 20,
  paddingBottom = 28,
  paddingLeft = 20,
}: TeamMemberCardProps) {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      style={{ width: "100%", display: "flex", justifyContent: "center" }}
    >
      <Element
        id="team-member-card-root"
        is={Section as any}
        canvas
        background="#ffffff"
        width="min(calc(50% - 8px), 240px)"
        flexShrink={0}
        paddingTop={paddingTop}
        paddingBottom={paddingBottom}
        paddingLeft={paddingLeft}
        paddingRight={paddingRight}
        borderRadius={12}
        boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
        borderWidth={1}
        borderColor="#e5e7eb"
        borderStyle="solid"
        flexDirection="column"
        alignItems="center"
        gap={10}
      >
        <Image
          src=""
          alt="Team Member Avatar"
          width="80px"
          height="80px"
          objectFit="cover"
          borderRadius={50}
          allowUpload
        />

        <Text
          text="John Doe"
          fontSize={16}
          fontWeight="700"
          color="#1e293b"
          textAlign="center"
        />

        <Text
          text="Web Developer"
          fontSize={13}
          fontWeight="600"
          color="#3b82f6"
          textAlign="center"
        />

        <Text
          text="Passionate about creating beautiful websites."
          fontSize={12}
          fontWeight="400"
          color="#64748b"
          textAlign="center"
          lineHeight={1.6}
        />
      </Element>
    </div>
  );
}

export const TeamMemberCardSettings = () => {
  const {
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    actions: { setProp },
  } = useNode((node) => ({
    paddingTop: (node.data.props.paddingTop as number | undefined) ?? 28,
    paddingRight: (node.data.props.paddingRight as number | undefined) ?? 20,
    paddingBottom: (node.data.props.paddingBottom as number | undefined) ?? 28,
    paddingLeft: (node.data.props.paddingLeft as number | undefined) ?? 20,
  }));

  return (
    <div className="flex flex-col gap-0">
      <DesignSection title="Spacing" defaultOpen>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--builder-text-faint)]">
          Outer card padding
        </p>
        <SpacingRow>
          <SpacingLabel>Top</SpacingLabel>
          <input
            type="number"
            min={0}
            max={200}
            value={paddingTop}
            onChange={(event) => setProp((props: TeamMemberCardProps) => { props.paddingTop = Number.parseInt(event.target.value || "0", 10) || 0; })}
            className="h-7 w-20 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]"
          />
        </SpacingRow>
        <SpacingRow>
          <SpacingLabel>Right</SpacingLabel>
          <input
            type="number"
            min={0}
            max={200}
            value={paddingRight}
            onChange={(event) => setProp((props: TeamMemberCardProps) => { props.paddingRight = Number.parseInt(event.target.value || "0", 10) || 0; })}
            className="h-7 w-20 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]"
          />
        </SpacingRow>
        <SpacingRow>
          <SpacingLabel>Bottom</SpacingLabel>
          <input
            type="number"
            min={0}
            max={200}
            value={paddingBottom}
            onChange={(event) => setProp((props: TeamMemberCardProps) => { props.paddingBottom = Number.parseInt(event.target.value || "0", 10) || 0; })}
            className="h-7 w-20 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]"
          />
        </SpacingRow>
        <SpacingRow>
          <SpacingLabel>Left</SpacingLabel>
          <input
            type="number"
            min={0}
            max={200}
            value={paddingLeft}
            onChange={(event) => setProp((props: TeamMemberCardProps) => { props.paddingLeft = Number.parseInt(event.target.value || "0", 10) || 0; })}
            className="h-7 w-20 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]"
          />
        </SpacingRow>
      </DesignSection>
    </div>
  );
};

TeamMemberCardCanvas.craft = {
  displayName: "Team Member Card",
  props: {
    paddingTop: 28,
    paddingRight: 20,
    paddingBottom: 28,
    paddingLeft: 20,
  },
  related: {
    settings: TeamMemberCardSettings,
  },
  rules: {
    canDrag: () => true,
  },
  isCanvas: false,
};

export const TeamMemberCard: TemplateEntry = {
  label: "Team Member Card",
  description: "Profile card for team members",
  preview: "👥",
  category: "card",
  element: React.createElement(TeamMemberCardCanvas),
};

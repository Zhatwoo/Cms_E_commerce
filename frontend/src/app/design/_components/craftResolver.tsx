"use client";

import React from "react";
import { Container } from "../_designComponents/Container/Container";
import { Text } from "../_designComponents/Text/Text";
import { Page } from "../_designComponents/Page/Page";
import { Viewport } from "../_designComponents/Viewport/Viewport";
import { Image } from "../_designComponents/Image/Image";
import { Button } from "../_designComponents/Button/Button";
import { Divider } from "../_designComponents/Divider/Divider";
import { Section } from "../_designComponents/Section/Section";
import { Row } from "../_designComponents/Row/Row";
import { Column } from "../_designComponents/Column/Column";
import { Icon } from "../_designComponents/Icon/Icon";
import { Frame } from "../_designComponents/Frame/Frame";
import { Tabs } from "../_designComponents/Tabs/Tabs";
import { TabContent } from "../_designComponents/Tabs/TabContent";
import { Circle } from "../../_assets/shapes/circle/circle";
import { Square } from "../../_assets/shapes/square/square";
import { Triangle } from "../../_assets/shapes/triangle/triangle";
import { ImportedBlock } from "../_designComponents/ImportedBlock/ImportedBlock";

type Resolver = Record<string, React.ComponentType<any>>;

function asComponent(value: unknown, fallback: React.ComponentType<any>): React.ComponentType<any> {
  return typeof value === "function" ? (value as React.ComponentType<any>) : fallback;
}

function withResolverFallback<T extends Resolver>(base: T): T {
  return new Proxy(base, {
    get(target, prop, receiver) {
      const direct = Reflect.get(target, prop, receiver);
      if (direct) return direct;
      if (typeof prop !== "string") return direct;

      const normalized = prop.trim().toLowerCase();
      const resolved =
        Reflect.get(target, prop.trim(), receiver) ||
        Reflect.get(target, normalized, receiver) ||
        Reflect.get(target, normalized.charAt(0).toUpperCase() + normalized.slice(1), receiver);

      return resolved || target.Container || Container;
    },
  }) as T;
}

/**
 * Resolver built in a dedicated module so Frame is always available when the module loads.
 * editorShell imports this file; this file does NOT import editorShell, so there is no
 * circular dependency and Frame is guaranteed to be defined.
 */
export function buildCraftResolver(): Resolver {
  const ContainerComp: React.ComponentType<any> =
    (typeof Container === "function" ? Container : null) ??
    ((props: any) => React.createElement("div", props, props?.children));
  const FrameComp = asComponent(Frame, ContainerComp);
  const TextComp = asComponent(Text, ContainerComp);
  const ImageComp = asComponent(Image, ContainerComp);
  const PageComp = asComponent(Page, ContainerComp);
  const ViewportComp = asComponent(Viewport, ContainerComp);
  const ButtonComp = asComponent(Button, ContainerComp);
  const DividerComp = asComponent(Divider, ContainerComp);
  const SectionComp = asComponent(Section, ContainerComp);
  const TabsComp = asComponent(Tabs, ContainerComp);
  const TabContentComp = asComponent(TabContent, ContainerComp);
  const RowComp = asComponent(Row, ContainerComp);
  const ColumnComp = asComponent(Column, ContainerComp);
  const IconComp = asComponent(Icon, ContainerComp);
  const CircleComp = asComponent(Circle, ContainerComp);
  const SquareComp = asComponent(Square, ContainerComp);
  const TriangleComp = asComponent(Triangle, ContainerComp);
  const ImportedBlockComp = asComponent(ImportedBlock, ContainerComp);
  const base: Resolver = {
    Frame: FrameComp,
    frame: FrameComp,
    Container: ContainerComp,
    container: ContainerComp,
    CONTAINER: ContainerComp,
    Text: TextComp,
    text: TextComp,
    Page: PageComp,
    page: PageComp,
    Viewport: ViewportComp,
    viewport: ViewportComp,
    Image: ImageComp,
    image: ImageComp,
    IMAGE: ImageComp,
    Button: ButtonComp,
    button: ButtonComp,
    Divider: DividerComp,
    Section: SectionComp,
    section: SectionComp,
    Tabs: TabsComp,
    tabs: TabsComp,
    TabContent: TabContentComp,
    tabcontent: TabContentComp,
    Row: RowComp,
    row: RowComp,
    Column: ColumnComp,
    column: ColumnComp,
    Icon: IconComp,
    icon: IconComp,
    Circle: CircleComp,
    Square: SquareComp,
    Triangle: TriangleComp,
    circle: CircleComp,
    square: SquareComp,
    triangle: TriangleComp,
    ImportedBlock: ImportedBlockComp,
    importedblock: ImportedBlockComp,
  };
  base.Frame = FrameComp;
  base.frame = FrameComp;
  base.Image = ImageComp;
  base.image = ImageComp;
  base.Text = TextComp;
  base.text = TextComp;
  base.Container = ContainerComp;
  base.container = ContainerComp;
  return base;
}

/** Single resolver instance with fallback lookups so unknown casing/legacy names never hard-crash. */
export const CRAFT_RESOLVER = withResolverFallback(buildCraftResolver());

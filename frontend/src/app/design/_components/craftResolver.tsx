"use client";

import React from "react";
import { Container } from "../_designComponents/Container/Container";
import { Text } from "../_designComponents/Text/Text";
import { Page } from "../_designComponents/Page/Page";
import { Viewport } from "../_designComponents/Viewport/Viewport";
import { Image } from "../_designComponents/Image/Image";
import { Video } from "../_designComponents/Video/Video";
import { Button } from "../_designComponents/Button/Button";
import { Divider } from "../_designComponents/Divider/Divider";
import { Section } from "../_designComponents/Section/Section";
import { Row } from "../_designComponents/Row/Row";
import { Column } from "../_designComponents/Column/Column";
import { Icon } from "../_designComponents/Icon/Icon";
import { Tabs } from "../_designComponents/Tabs/Tabs";
<<<<<<<<< Temporary merge branch 1
import { Spacer } from "../_designComponents/Spacer/Spacer";
import { Pagination } from "../_designComponents/Pagination/Pagination";
import { Rating } from "../_designComponents/Rating/Rating";
import { Banner } from "../_designComponents/Banner/banner";
import { Badge } from "../_designComponents/Badge/badge";
import { BooleanField } from "../_designComponents/BooleanField/BooleanField";
import { IconRow } from "../_designComponents/IconRow/IconRow";
import { Circle } from "../../_assets/shapes/circle/circle";
import { Square } from "../../_assets/shapes/square/square";
import { Triangle } from "../../_assets/shapes/triangle/triangle";
import { ImportedBlock } from "../_designComponents/ImportedBlock/ImportedBlock";
import { Accordion } from "../_designComponents/Accordion/Accordion";

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
    has(target, prop) {
      if (Reflect.has(target, prop)) return true;
      if (typeof prop !== "string") {
        return Reflect.has(target, "Container") || Reflect.has(target, "container");
      }

      const normalized = prop.trim().toLowerCase();
      if (Reflect.has(target, normalized)) return true;

      const canonical = normalized.charAt(0).toUpperCase() + normalized.slice(1);
      if (Reflect.has(target, canonical)) return true;

      if (
        normalized.includes("image") ||
        normalized === "img" ||
        normalized === "imagecomponent"
      ) {
        return (
          Reflect.has(target, "Image") ||
          Reflect.has(target, "image") ||
          Reflect.has(target, "IMAGE") ||
          Reflect.has(target, "img") ||
          Reflect.has(target, "Img") ||
          Reflect.has(target, "ImageComponent")
        );
      }

      return Reflect.has(target, "Container") || Reflect.has(target, "container");
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
  const TextComp = asComponent(Text, ContainerComp);
  const ImageComp = asComponent(Image, ContainerComp);
  const VideoComp = asComponent(Video, ContainerComp);
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
  const BannerComp = asComponent(Banner, ContainerComp);
  const BadgeComp = asComponent(Badge, ContainerComp);
  const CircleComp = asComponent(Circle, ContainerComp);
  const SquareComp = asComponent(Square, ContainerComp);
  const TriangleComp = asComponent(Triangle, ContainerComp);
  const ImportedBlockComp = asComponent(ImportedBlock, ContainerComp);
  const SpacerComp = asComponent(Spacer, ContainerComp);
  const PaginationComp = asComponent(Pagination, ContainerComp);
<<<<<<<<< Temporary merge branch 1
  const RatingComp = asComponent(Rating, ContainerComp);
  const BooleanFieldComp = asComponent(BooleanField, ContainerComp);
  const base: Resolver = {
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
    img: ImageComp,
    Img: ImageComp,
    ImageComponent: ImageComp,
    Video: VideoComp,
    video: VideoComp,
    VIDEO: VideoComp,
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
    Banner: BannerComp,
    banner: BannerComp,
    Badge: BadgeComp,
    badge: BadgeComp,
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
    Accordion: asComponent(Accordion, ContainerComp),
    accordion: asComponent(Accordion, ContainerComp),
    Spacer: SpacerComp,
    spacer: SpacerComp,
    SPACER: SpacerComp,
    Pagination: PaginationComp,
    pagination: PaginationComp,
    PAGINATION: PaginationComp,
    Rating: RatingComp,
    rating: RatingComp,
    RATING: RatingComp,
    BooleanField: BooleanFieldComp,
    booleanfield: BooleanFieldComp,
    BOOLEANFIELD: BooleanFieldComp,
  };
  base.Image = ImageComp;
  base.image = ImageComp;
  base.Text = TextComp;
  base.text = TextComp;
  base.Container = ContainerComp;
  base.container = ContainerComp;
  addAliases(base, "Button", ButtonComp);
  addAliases(base, "Divider", DividerComp);
  addAliases(base, "Banner", BannerComp);
  addAliases(base, "Badge", BadgeComp);
  addAliases(base, "Pagination", PaginationComp);
  addAliases(base, "BooleanField", BooleanFieldComp, [
    "Boolean Field",
    "boolean field",
    "Checkbox",
    "checkbox",
    "CheckBox",
    "Radio",
    "radio",
  ]);
  return base;
}

/** Shared plain resolver map for editor/preview usage. */
export const CRAFT_RESOLVER = buildCraftResolver();

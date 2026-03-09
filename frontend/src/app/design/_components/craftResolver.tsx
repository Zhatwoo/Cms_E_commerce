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
import { Circle } from "../../_assets/shapes/circle/circle";
import { Square } from "../../_assets/shapes/square/square";
import { Triangle } from "../../_assets/shapes/triangle/triangle";

type Resolver = Record<string, React.ComponentType<any>>;

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
  const FrameComp = typeof Frame === "function" ? Frame : Container;
  const TextComp = (typeof Text === "function" ? Text : null) ?? Container;
  const ImageComp = (typeof Image === "function" ? Image : null) ?? Container;
  const base: Resolver = {
    Frame: FrameComp,
    frame: FrameComp,
    Container: ContainerComp,
    container: ContainerComp,
    Text: TextComp,
    text: TextComp,
    Page,
    Viewport,
    Image: Image || Container,
    image: Image || Container,
    Button: (typeof Button === "function" ? Button : null) ?? Container,
    button: (typeof Button === "function" ? Button : null) ?? Container,
    Divider,
    Section,
    Row,
    Column,
    Icon,
    Circle: Circle || ContainerComp,
    Square: Square || ContainerComp,
    Triangle: Triangle || ContainerComp,
    circle: Circle || ContainerComp,
    square: Square || ContainerComp,
    triangle: Triangle || ContainerComp,
  };
  base.Frame = FrameComp;
  base.frame = FrameComp;
  base.Image = (typeof Image === "function" ? Image : null) ?? ContainerComp;
  base.image = (typeof Image === "function" ? Image : null) ?? ContainerComp;
  base.Text = (typeof Text === "function" ? Text : null) ?? ContainerComp;
  base.text = (typeof Text === "function" ? Text : null) ?? ContainerComp;
  base.Container = ContainerComp;
  base.container = ContainerComp;
  return base;
}

/** Single resolver instance so Editor always receives the same reference with Frame defined. */
export const CRAFT_RESOLVER = buildCraftResolver();

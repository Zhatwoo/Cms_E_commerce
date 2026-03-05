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

/**
 * Resolver built in a dedicated module so Frame is always available when the module loads.
 * editorShell imports this file; this file does NOT import editorShell, so there is no
 * circular dependency and Frame is guaranteed to be defined.
 */
export function buildCraftResolver(): Resolver {
  const FrameComp = typeof Frame === "function" ? Frame : Container;
  const base: Resolver = {
    Frame: FrameComp,
    frame: FrameComp,
    Container,
    Text: Text || Container,
    text: Text || Container,
    Page,
    Viewport,
    Image: Image || Container,
    image: Image || Container,
    Button,
    Divider,
    Section,
    Row,
    Column,
    Icon,
    Circle: Circle || Container,
    Square: Square || Container,
    Triangle: Triangle || Container,
    circle: Circle || Container,
    square: Square || Container,
    triangle: Triangle || Container,
  };
  base.Frame = FrameComp;
  base.frame = FrameComp;
  return base;
}

/** Single resolver instance so Editor always receives the same reference with Frame defined. */
export const CRAFT_RESOLVER = buildCraftResolver();

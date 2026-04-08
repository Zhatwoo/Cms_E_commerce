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
import { TabContent } from "../_designComponents/Tabs/TabContent";
import { Spacer } from "../_designComponents/Spacer/Spacer";
import { Pagination } from "../_designComponents/Pagination/Pagination";
import { Rating } from "../_designComponents/Rating/Rating";
import { Banner } from "../_designComponents/Banner/banner";
import { Badge } from "../_designComponents/Badge/badge";
import { BooleanField } from "../_designComponents/BooleanField/BooleanField";
import { Circle } from "../../_assets/shapes/circle/circle";
import { Square } from "../../_assets/shapes/square/square";
import { Triangle } from "../../_assets/shapes/triangle/triangle";
import { Rectangle } from "../../_assets/shapes/rectangle/rectangle";
import {
  Diamond,
  Heart,
  Trapezoid,
  Pentagon,
  Hexagon,
  Heptagon,
  Octagon,
  Nonagon,
  Decagon,
  Parallelogram,
  Kite
} from "../../_assets/shapes/additional_shapes";
import { ImportedBlock } from "../_designComponents/ImportedBlock/ImportedBlock";
import { Accordion } from "../_designComponents/Accordion/Accordion";
import { ProfileLoginNode } from "../../_assets/Header/profile-login/profile-login";
import { ProductSlider } from "../_designComponents/ProductSlider/ProductSlider";
import { ProductCard as ProductCardComponent } from "../_designComponents/ProductCard/ProductCard";
import { ProductDescriptionCard as ProductDescriptionCardComponent } from "../_designComponents/ProductDescriptionCard/ProductDescriptionCard";

type Resolver = Record<string, React.ComponentType<any>>;

function asComponent(value: unknown, fallback: React.ComponentType<any>): React.ComponentType<any> {
  return typeof value === "function" ? (value as React.ComponentType<any>) : fallback;
}

function withResolverFallback<T extends Resolver>(base: T): T {
  const shapes = ["circle", "square", "triangle", "rectangle", "diamond", "heart", "trapezoid", "pentagon", "hexagon", "heptagon", "octagon", "nonagon", "decagon", "parallelogram", "kite"];

  return new Proxy(base, {
    get(target, prop, receiver) {
      const direct = Reflect.get(target, prop, receiver);
      if (direct) return direct;
      if (typeof prop !== "string") return direct;

      const normalized = prop.trim().toLowerCase();
      
      // Fuzzy shape match for numbered names (e.g. "Heart 1" -> "Heart")
      const fuzzyShape = shapes.find(s => normalized.includes(s));
      if (fuzzyShape) {
        const canonical = fuzzyShape.charAt(0).toUpperCase() + fuzzyShape.slice(1);
        const shapeComp = Reflect.get(target, canonical, receiver) || Reflect.get(target, fuzzyShape, receiver);
        if (shapeComp) return shapeComp;
      }

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

      // Keep Craft from throwing when a saved/dragged node uses an unexpected
      // name variant; `get()` will still return a safe fallback component.
      return true;
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
  const RectangleComp = asComponent(Rectangle, ContainerComp);
  const DiamondComp = asComponent(Diamond, ContainerComp);
  const HeartComp = asComponent(Heart, ContainerComp);
  const TrapezoidComp = asComponent(Trapezoid, ContainerComp);
  const PentagonComp = asComponent(Pentagon, ContainerComp);
  const HexagonComp = asComponent(Hexagon, ContainerComp);
  const HeptagonComp = asComponent(Heptagon, ContainerComp);
  const OctagonComp = asComponent(Octagon, ContainerComp);
  const NonagonComp = asComponent(Nonagon, ContainerComp);
  const DecagonComp = asComponent(Decagon, ContainerComp);
  const ParallelogramComp = asComponent(Parallelogram, ContainerComp);
  const KiteComp = asComponent(Kite, ContainerComp);
  const ImportedBlockComp = asComponent(ImportedBlock, ContainerComp);
  const SpacerComp = asComponent(Spacer, ContainerComp);
  const PaginationComp = asComponent(Pagination, ContainerComp);
  const RatingComp = asComponent(Rating, ContainerComp);
  const BooleanFieldComp = asComponent(BooleanField, ContainerComp);
  const ProfileLoginNodeComp = asComponent(ProfileLoginNode, ContainerComp);
  const ProductSliderComp = asComponent(ProductSlider, ContainerComp);
  const ProductCardComp = asComponent(ProductCardComponent, ContainerComp);
  const ProductDescriptionCardComp = asComponent(ProductDescriptionCardComponent, ContainerComp);
  const addAliases = (base: Resolver, name: string, comp: React.ComponentType<any>, extra: string[] = []) => {
    const variants = [
      name,
      name.toLowerCase(),
      name.toUpperCase(),
      ...extra,
    ];
    variants.forEach((key) => {
      if (!key) return;
      base[key] = comp;
    });
  };
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
    Rectangle: RectangleComp,
    Diamond: DiamondComp,
    Heart: HeartComp,
    Trapezoid: TrapezoidComp,
    Pentagon: PentagonComp,
    Hexagon: HexagonComp,
    Heptagon: HeptagonComp,
    Octagon: OctagonComp,
    Nonagon: NonagonComp,
    Decagon: DecagonComp,
    Parallelogram: ParallelogramComp,
    Kite: KiteComp,
    circle: CircleComp,
    square: SquareComp,
    triangle: TriangleComp,
    rectangle: RectangleComp,
    diamond: DiamondComp,
    heart: HeartComp,
    trapezoid: TrapezoidComp,
    pentagon: PentagonComp,
    hexagon: HexagonComp,
    heptagon: HeptagonComp,
    octagon: OctagonComp,
    nonagon: NonagonComp,
    decagon: DecagonComp,
    parallelogram: ParallelogramComp,
    kite: KiteComp,
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
    ProfileLoginNode: ProfileLoginNodeComp,
    profileloginnode: ProfileLoginNodeComp,
    PROFILELOGINNODE: ProfileLoginNodeComp,
    ProfileLogin: ProfileLoginNodeComp,
    profilelogin: ProfileLoginNodeComp,
    PROFILELOGIN: ProfileLoginNodeComp,
    ProductSlider: ProductSliderComp,
    productslider: ProductSliderComp,
    "Product Slider": ProductSliderComp,
    ProductCard: ProductCardComp,
    productcard: ProductCardComp,
    "Product Card": ProductCardComp,
    ProductDescriptionCard: ProductDescriptionCardComp,
    productdescriptioncard: ProductDescriptionCardComp,
    "Product Description Card": ProductDescriptionCardComp,
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
  addAliases(base, "ProfileLoginNode", ProfileLoginNodeComp, ["ProfileLogin", "profilelogin"]);
  addAliases(base, "ProductSlider", ProductSliderComp, ["Product Slider", "productslider"]);
  addAliases(base, "CategoriesCardCanvas", CategoriesCardCanvasComp, ["Categories Card Canvas", "categoriescardcanvas"]);
  addAliases(base, "CategoryTile", CategoryTileComp, ["Category Tile", "categorytile"]);
  addAliases(base, "ProductCard", ProductCardComp, ["Product Card", "productcard"]);
  addAliases(base, "ProductDescriptionCard", ProductDescriptionCardComp, ["Product Description Card", "productdescriptioncard"]);
  addAliases(base, "HeroBannerCTA_v2Block", HeroBannerCTA_v2BlockComp, ["Hero Banner CTA v2 Block", "herobannercta_v2block"]);
  addAliases(base, "HeroBannerCTABlock", HeroBannerCTABlockComp, ["Hero Banner CTA Block", "herobannerctablock"]);
  addAliases(base, "HeroWithImageBlock", HeroWithImageBlockComp, ["Hero With Image Block", "herowithimageblock"]);
  addAliases(base, "CenteredHeroBlock", CenteredHeroBlockComp, ["Centered Hero Block", "centeredheroblock"]);
  return base;
}

/** Shared plain resolver map for editor/preview usage. */
export const CRAFT_RESOLVER = buildCraftResolver();

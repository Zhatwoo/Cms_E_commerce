import React from "react";
import { useNode } from "@craftjs/core";
import { IconSettings } from "./IconSettings";
import type { IconProps } from "../../_types/components";
import { Facebook } from "../../../_assets/Icon/Facebook/Facebook";
import { Google } from "../../../_assets/Icon/Google/Google";
import { Instagram } from "../../../_assets/Icon/Instagram/Instagram";
import { Twitter } from "../../../_assets/Icon/Twitter/Twitter";
import { Search } from "../../../_assets/Icon/Search/Search";
import { Home } from "../../../_assets/Icon/Home/Home";
import { Bell } from "../../../_assets/Icon/Bell/Bell";
import { Menu } from "../../../_assets/Icon/Menu/Menu";
import { Close } from "../../../_assets/Icon/Close/Close";
import { Settings } from "../../../_assets/Icon/Settings/Settings";
import { Heart } from "../../../_assets/Icon/Heart/Heart";
import { Plus } from "../../../_assets/Icon/Plus/Plus";
import { Trash } from "../../../_assets/Icon/Trash/Trash";
import { Star } from "../../../_assets/Icon/Star/Star";
import { Check } from "../../../_assets/Icon/Check/Check";
import { ChevronRight } from "../../../_assets/Icon/ChevronRight/ChevronRight";
import { ArrowLeft } from "../../../_assets/Icon/ArrowLeft/ArrowLeft";
import { ArrowRight } from "../../../_assets/Icon/ArrowRight/ArrowRight";
import { Cart } from "../../../_assets/Icon/Cart/Cart";
import { ShoppingBag } from "../../../_assets/Icon/ShoppingBag/ShoppingBag";
import { ShoppingBasket } from "../../../_assets/Icon/ShoppingBasket/ShoppingBasket";
import { User } from "../../../_assets/Icon/User/User";

export const Icon = ({
  iconType = "home",
  size = 24,
  color = "currentColor",
  width = "auto",
  height = "auto",
  margin = 0,
  marginTop = 0,
  marginRight = 0,
  marginBottom = 0,
  marginLeft = 0,
  padding = 0,
  paddingTop = 0,
  paddingRight = 0,
  paddingBottom = 0,
  paddingLeft = 0,
  opacity = 1,
  link = "",
  position = "relative",
  display = "inline-flex",
  zIndex = 0,
  alignSelf = "auto",
  top = "auto",
  right = "auto",
  bottom = "auto",
  left = "auto",
  editorVisibility = "auto",
  visibility = "visible",
  rotation = 0,
  flipHorizontal = false,
  flipVertical = false,
  boxShadow = "none",
  overflow = "visible",
  cursor = "default",
  customClassName = "",
}: IconProps) => {
  let connect: any;
  let drag: any;

  try {
    const nodeContext = useNode();
    connect = nodeContext.connectors.connect;
    drag = nodeContext.connectors.drag;
  } catch (e) {
    // Not in an Editor context - provide no-op functions
    connect = (ref: any) => ref;
    drag = (ref: any) => ref;
  }

  const m = typeof margin === "number" ? margin : 0;
  const mt = marginTop ?? m;
  const mr = marginRight ?? m;
  const mb = marginBottom ?? m;
  const ml = marginLeft ?? m;

  const p = typeof padding === "number" ? padding : 0;
  const pt = paddingTop ?? p;
  const pr = paddingRight ?? p;
  const pb = paddingBottom ?? p;
  const pl = paddingLeft ?? p;

  let IconComponent: React.FC<{ size?: number; className?: string }>;
  switch (iconType) {
    case "search":
      IconComponent = Search;
      break;
    case "bell":
      IconComponent = Bell;
      break;
    case "home":
      IconComponent = Home;
      break;
    case "menu":
      IconComponent = Menu;
      break;
    case "close":
      IconComponent = Close;
      break;
    case "settings":
      IconComponent = Settings;
      break;
    case "heart":
      IconComponent = Heart;
      break;
    case "plus":
      IconComponent = Plus;
      break;
    case "trash":
      IconComponent = Trash;
      break;
    case "star":
      IconComponent = Star;
      break;
    case "check":
      IconComponent = Check;
      break;
    case "chevron-right":
      IconComponent = ChevronRight;
      break;
    case "arrow-left":
      IconComponent = ArrowLeft;
      break;
    case "arrow-right":
      IconComponent = ArrowRight;
      break;
    case "cart":
      IconComponent = Cart;
      break;
    case "shoppingBag":
      IconComponent = ShoppingBag;
      break;
    case "shoppingBasket":
      IconComponent = ShoppingBasket;
      break;
    case "user":
      IconComponent = User;
      break;
    case "facebook":
      IconComponent = Facebook;
      break;
    case "google":
      IconComponent = Google;
      break;
    case "instagram":
      IconComponent = Instagram;
      break;
    case "twitter":
      IconComponent = Twitter;
      break;
    default:
      IconComponent = Home;
  }
  const hasExplicitBox = width !== "auto" || height !== "auto";
  const fitToBox = true;
  const resolvedWidth = hasExplicitBox ? width : `${size}px`;
  const resolvedHeight = hasExplicitBox ? height : `${size}px`;

  const effectiveDisplay =
    editorVisibility === "hide"
      ? "none"
      : editorVisibility === "show" && display === "none"
        ? "inline-flex"
        : display;

  const transformStyle =
    [
      rotation ? `rotate(${rotation}deg)` : null,
      flipHorizontal ? "scaleX(-1)" : null,
      flipVertical ? "scaleY(-1)" : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        color,
        width: resolvedWidth,
        height: resolvedHeight,
        marginTop: `${mt}px`,
        marginRight: `${mr}px`,
        marginBottom: `${mb}px`,
        marginLeft: `${ml}px`,
        paddingTop: `${pt}px`,
        paddingRight: `${pr}px`,
        paddingBottom: `${pb}px`,
        paddingLeft: `${pl}px`,
        opacity,
        display: effectiveDisplay,
        alignSelf,
        alignItems: "center",
        justifyContent: "center",
        cursor: link ? "pointer" : cursor,
        boxShadow,
        overflow,
        position,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? right : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? left : undefined,
        visibility: visibility === "hidden" ? "hidden" : "visible",
        transform: transformStyle,
      }}
      className={customClassName}
    >
      <IconComponent size={size} className={fitToBox ? "w-full h-full" : ""} />
    </div>
  );
};

export const IconDefaultProps: Partial<IconProps> = {
  iconType: "home",
  size: 24,
  color: "currentColor",
  width: "auto",
  height: "auto",
  margin: 0,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
  padding: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  opacity: 1,
  link: "",
};

Icon.craft = {
  displayName: "Icon",
  props: IconDefaultProps,
  related: {
    settings: IconSettings,
  },
};

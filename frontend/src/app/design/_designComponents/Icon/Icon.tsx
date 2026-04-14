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
import { Package } from "../../../_assets/Icon/Package/Package";
import { Truck } from "../../../_assets/Icon/Truck/Truck";
import { CreditCard } from "../../../_assets/Icon/CreditCard/CreditCard";
import { Tag } from "../../../_assets/Icon/Tag/Tag";
import { Store } from "../../../_assets/Icon/Store/Store";
import { Receipt } from "../../../_assets/Icon/Receipt/Receipt";
import { Wallet } from "../../../_assets/Icon/Wallet/Wallet";
import { Coupon } from "../../../_assets/Icon/Coupon/Coupon";
import { Barcode } from "../../../_assets/Icon/Barcode/Barcode";
import { ShieldCheck } from "../../../_assets/Icon/ShieldCheck/ShieldCheck";
import { Gift } from "../../../_assets/Icon/Gift/Gift";
import { QrCode } from "../../../_assets/Icon/QrCode/QrCode";
import { Banknote } from "../../../_assets/Icon/Banknote/Banknote";
import { BoxOpen } from "../../../_assets/Icon/BoxOpen/BoxOpen";
import { PackageCheck } from "../../../_assets/Icon/PackageCheck/PackageCheck";
import { Scan } from "../../../_assets/Icon/Scan/Scan";
import { Inventory } from "../../../_assets/Icon/Inventory/Inventory";
import { Warehouse } from "../../../_assets/Icon/Warehouse/Warehouse";
import { Return } from "../../../_assets/Icon/Return/Return";
import { Refund } from "../../../_assets/Icon/Refund/Refund";
import { Loyalty } from "../../../_assets/Icon/Loyalty/Loyalty";
import { Verified } from "../../../_assets/Icon/Verified/Verified";
import { BoltDeal } from "../../../_assets/Icon/BoltDeal/BoltDeal";
import { Timer } from "../../../_assets/Icon/Timer/Timer";
import { PercentOff } from "../../../_assets/Icon/PercentOff/PercentOff";
import { TargetDeal } from "../../../_assets/Icon/TargetDeal/TargetDeal";
import { Headset } from "../../../_assets/Icon/Headset/Headset";
import { ChatSupport } from "../../../_assets/Icon/ChatSupport/ChatSupport";
import { HelpCircle } from "../../../_assets/Icon/HelpCircle/HelpCircle";
import { PhoneCall } from "../../../_assets/Icon/PhoneCall/PhoneCall";
import { MailSupport } from "../../../_assets/Icon/MailSupport/MailSupport";
import {
  DebitCard,
  BankTransfer,
  PosTerminal,
  Invoice,
  CashOnDelivery,
  DeliveryBike,
  Tracking,
  ReturnBox,
  WarehouseShelf,
  PickupPoint,
  FilterIconCommerce,
  SortIconCommerce,
  Compare,
  Wishlist,
  RecentlyViewed,
  MoneyBack,
  VerifiedSeller,
  BestPrice,
  AuthenticProduct,
  BundleOffer,
} from "../../../_assets/Icon/CommercePlus/CommercePlus";
import {
  YouTubeSocial,
  TikTokSocial,
  LinkedInSocial,
  PinterestSocial,
  SnapchatSocial,
  RedditSocial,
  TelegramSocial,
  DiscordSocial,
  WhatsAppSocial,
  TwitchSocial,
  GithubSocial,
  DribbbleSocial,
  BehanceSocial,
  MediumSocial,
  ThreadsSocial,
  LineSocial,
  WeChatSocial,
  ViberSocial,
  SignalSocial,
  MessengerSocial,
  VimeoSocial,
  TumblrSocial,
  XingSocial,
} from "../../../_assets/Icon/SocialPlus/SocialPlus";
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
    case "package":
      IconComponent = Package;
      break;
    case "truck":
      IconComponent = Truck;
      break;
    case "creditCard":
      IconComponent = CreditCard;
      break;
    case "tag":
      IconComponent = Tag;
      break;
    case "store":
      IconComponent = Store;
      break;
    case "receipt":
      IconComponent = Receipt;
      break;
    case "wallet":
      IconComponent = Wallet;
      break;
    case "coupon":
      IconComponent = Coupon;
      break;
    case "barcode":
      IconComponent = Barcode;
      break;
    case "shieldCheck":
      IconComponent = ShieldCheck;
      break;
    case "gift":
      IconComponent = Gift;
      break;
    case "qrCode":
      IconComponent = QrCode;
      break;
    case "banknote":
      IconComponent = Banknote;
      break;
    case "boxOpen":
      IconComponent = BoxOpen;
      break;
    case "packageCheck":
      IconComponent = PackageCheck;
      break;
    case "scan":
      IconComponent = Scan;
      break;
    case "inventory":
      IconComponent = Inventory;
      break;
    case "warehouse":
      IconComponent = Warehouse;
      break;
    case "return":
      IconComponent = Return;
      break;
    case "refund":
      IconComponent = Refund;
      break;
    case "loyalty":
      IconComponent = Loyalty;
      break;
    case "verified":
      IconComponent = Verified;
      break;
    case "boltDeal":
      IconComponent = BoltDeal;
      break;
    case "timer":
      IconComponent = Timer;
      break;
    case "percentOff":
      IconComponent = PercentOff;
      break;
    case "targetDeal":
      IconComponent = TargetDeal;
      break;
    case "headset":
      IconComponent = Headset;
      break;
    case "chatSupport":
      IconComponent = ChatSupport;
      break;
    case "helpCircle":
      IconComponent = HelpCircle;
      break;
    case "phoneCall":
      IconComponent = PhoneCall;
      break;
    case "mailSupport":
      IconComponent = MailSupport;
      break;
    case "debitCard":
      IconComponent = DebitCard;
      break;
    case "bankTransfer":
      IconComponent = BankTransfer;
      break;
    case "posTerminal":
      IconComponent = PosTerminal;
      break;
    case "invoice":
      IconComponent = Invoice;
      break;
    case "cashOnDelivery":
      IconComponent = CashOnDelivery;
      break;
    case "deliveryBike":
      IconComponent = DeliveryBike;
      break;
    case "tracking":
      IconComponent = Tracking;
      break;
    case "returnBox":
      IconComponent = ReturnBox;
      break;
    case "warehouseShelf":
      IconComponent = WarehouseShelf;
      break;
    case "pickupPoint":
      IconComponent = PickupPoint;
      break;
    case "filterCommerce":
      IconComponent = FilterIconCommerce;
      break;
    case "sortCommerce":
      IconComponent = SortIconCommerce;
      break;
    case "compare":
      IconComponent = Compare;
      break;
    case "wishlist":
      IconComponent = Wishlist;
      break;
    case "recentlyViewed":
      IconComponent = RecentlyViewed;
      break;
    case "moneyBack":
      IconComponent = MoneyBack;
      break;
    case "verifiedSeller":
      IconComponent = VerifiedSeller;
      break;
    case "bestPrice":
      IconComponent = BestPrice;
      break;
    case "authenticProduct":
      IconComponent = AuthenticProduct;
      break;
    case "bundleOffer":
      IconComponent = BundleOffer;
      break;
    case "youtube":
      IconComponent = YouTubeSocial;
      break;
    case "tiktok":
      IconComponent = TikTokSocial;
      break;
    case "linkedin":
      IconComponent = LinkedInSocial;
      break;
    case "pinterest":
      IconComponent = PinterestSocial;
      break;
    case "snapchat":
      IconComponent = SnapchatSocial;
      break;
    case "reddit":
      IconComponent = RedditSocial;
      break;
    case "telegram":
      IconComponent = TelegramSocial;
      break;
    case "discord":
      IconComponent = DiscordSocial;
      break;
    case "whatsapp":
      IconComponent = WhatsAppSocial;
      break;
    case "twitch":
      IconComponent = TwitchSocial;
      break;
    case "github":
      IconComponent = GithubSocial;
      break;
    case "dribbble":
      IconComponent = DribbbleSocial;
      break;
    case "behance":
      IconComponent = BehanceSocial;
      break;
    case "medium":
      IconComponent = MediumSocial;
      break;
    case "threads":
      IconComponent = ThreadsSocial;
      break;
    case "line":
      IconComponent = LineSocial;
      break;
    case "wechat":
      IconComponent = WeChatSocial;
      break;
    case "viber":
      IconComponent = ViberSocial;
      break;
    case "signal":
      IconComponent = SignalSocial;
      break;
    case "messenger":
      IconComponent = MessengerSocial;
      break;
    case "vimeo":
      IconComponent = VimeoSocial;
      break;
    case "tumblr":
      IconComponent = TumblrSocial;
      break;
    case "xing":
      IconComponent = XingSocial;
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

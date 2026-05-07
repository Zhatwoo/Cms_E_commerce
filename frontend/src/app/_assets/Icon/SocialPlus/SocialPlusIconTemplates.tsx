"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import type { TemplateEntry } from "../../_types";
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
} from "./SocialPlus";

const make = (
  label: string,
  description: string,
  iconType: string,
  Preview: React.FC<{ className?: string; size?: number }>
): TemplateEntry => ({
  label,
  description,
  preview: React.createElement(Preview, { size: 24 }),
  element: React.createElement(Element as any, {
    is: Icon as any,
    iconType,
    size: 32,
    color: "currentColor",
  }),
  category: "icon",
});

export const YouTubeIcon = make("YouTube Icon", "YouTube social icon", "youtube", YouTubeSocial);
export const TikTokIcon = make("TikTok Icon", "TikTok social icon", "tiktok", TikTokSocial);
export const LinkedInIcon = make("LinkedIn Icon", "LinkedIn social icon", "linkedin", LinkedInSocial);
export const PinterestIcon = make("Pinterest Icon", "Pinterest social icon", "pinterest", PinterestSocial);
export const SnapchatIcon = make("Snapchat Icon", "Snapchat social icon", "snapchat", SnapchatSocial);
export const RedditIcon = make("Reddit Icon", "Reddit social icon", "reddit", RedditSocial);
export const TelegramIcon = make("Telegram Icon", "Telegram social icon", "telegram", TelegramSocial);
export const DiscordIcon = make("Discord Icon", "Discord social icon", "discord", DiscordSocial);
export const WhatsAppIcon = make("WhatsApp Icon", "WhatsApp social icon", "whatsapp", WhatsAppSocial);
export const TwitchIcon = make("Twitch Icon", "Twitch social icon", "twitch", TwitchSocial);
export const GithubIcon = make("GitHub Icon", "GitHub social icon", "github", GithubSocial);
export const DribbbleIcon = make("Dribbble Icon", "Dribbble social icon", "dribbble", DribbbleSocial);
export const BehanceIcon = make("Behance Icon", "Behance social icon", "behance", BehanceSocial);
export const MediumIcon = make("Medium Icon", "Medium social icon", "medium", MediumSocial);
export const ThreadsIcon = make("Threads Icon", "Threads social icon", "threads", ThreadsSocial);
export const LineIcon = make("Line Icon", "Line social icon", "line", LineSocial);
export const WeChatIcon = make("WeChat Icon", "WeChat social icon", "wechat", WeChatSocial);
export const ViberIcon = make("Viber Icon", "Viber social icon", "viber", ViberSocial);
export const SignalIcon = make("Signal Icon", "Signal social icon", "signal", SignalSocial);
export const MessengerIcon = make("Messenger Icon", "Messenger social icon", "messenger", MessengerSocial);
export const VimeoIcon = make("Vimeo Icon", "Vimeo social icon", "vimeo", VimeoSocial);
export const TumblrIcon = make("Tumblr Icon", "Tumblr social icon", "tumblr", TumblrSocial);
export const XingIcon = make("Xing Icon", "Xing social icon", "xing", XingSocial);

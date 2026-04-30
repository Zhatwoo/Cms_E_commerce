import React from 'react';
import {
  FaYoutube,
  FaTiktok,
  FaLinkedin,
  FaPinterestP,
  FaSnapchat,
  FaRedditAlien,
  FaTelegram,
  FaDiscord,
  FaWhatsapp,
  FaTwitch,
  FaGithub,
  FaDribbble,
  FaBehance,
  FaMedium,
  FaHashtag,
  FaCommentDots,
  FaWeixin,
  FaViber,
  FaCommentAlt,
  FaFacebookF,
  FaVimeo,
  FaTumblr,
  FaXing,
} from 'react-icons/fa';

type IconProps = {
  className?: string;
  size?: number;
};

export const YouTubeSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaYoutube className={className} size={size} />;
export const TikTokSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaTiktok className={className} size={size} />;
export const LinkedInSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaLinkedin className={className} size={size} />;
export const PinterestSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaPinterestP className={className} size={size} />;
export const SnapchatSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaSnapchat className={className} size={size} />;
export const RedditSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaRedditAlien className={className} size={size} />;
export const TelegramSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaTelegram className={className} size={size} />;
export const DiscordSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaDiscord className={className} size={size} />;
export const WhatsAppSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaWhatsapp className={className} size={size} />;
export const TwitchSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaTwitch className={className} size={size} />;
export const GithubSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaGithub className={className} size={size} />;
export const DribbbleSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaDribbble className={className} size={size} />;
export const BehanceSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaBehance className={className} size={size} />;
export const MediumSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaMedium className={className} size={size} />;
export const ThreadsSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaHashtag className={className} size={size} />;
export const LineSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaCommentDots className={className} size={size} />;
export const WeChatSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaWeixin className={className} size={size} />;
export const ViberSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaViber className={className} size={size} />;
export const SignalSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaCommentAlt className={className} size={size} />;
export const MessengerSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaFacebookF className={className} size={size} />;
export const VimeoSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaVimeo className={className} size={size} />;
export const TumblrSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaTumblr className={className} size={size} />;
export const XingSocial: React.FC<IconProps> = ({ className = '', size = 24 }) => <FaXing className={className} size={size} />;

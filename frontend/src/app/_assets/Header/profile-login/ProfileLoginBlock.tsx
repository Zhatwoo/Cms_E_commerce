"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "../../Icon/ChevronRight/ChevronRight";
import { Google } from "../../Icon/Google/Google";
import {
  getPublishedSiteIdentifier,
  getPublishedSiteMe,
  getStoredUser,
  getStoredPublishedSiteUser,
  getMe,
  loginPublishedSiteUser,
  loginWithGoogle,
  logout,
  logoutPublishedSiteUser,
  registerPublishedSiteUser,
  type User,
} from "@/lib/api";

export interface ProfileLoginBlockProps {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: number | string;
  letterSpacing?: number | string;
  color?: string;
  iconColor?: string;
  arrowSize?: number;
  avatarSrc?: string;
  avatarSize?: number;
  width?: string | number;
  height?: string | number;
  display?: "inline-flex" | "flex" | "block";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  gap?: number;
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  margin?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  background?: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: string;
  boxShadow?: string;
  opacity?: number;
  overflow?: string;
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: number;
  rotation?: number;
  customClassName?: string;
  interactive?: boolean;
  accountHref?: string;
  nodeId?: string;
}

function getUserLabel(user: User | null, fallback: string): string {
  if (!user) return fallback;
  const name = typeof user.name === "string" ? user.name.trim() : "";
  if (name) return name;
  const email = typeof user.email === "string" ? user.email.trim() : "";
  if (!email) return fallback;
  return email.split("@")[0] || fallback;
}

function getUserAvatar(user: User | null, fallback: string): string {
  if (user?.avatar && user.avatar.trim()) return user.avatar.trim();
  return fallback;
}

export function ProfileLoginBlock({
  text = "Login",
  fontSize = 34,
  fontFamily = "EB Garamond",
  fontWeight = "500",
  fontStyle = "normal",
  lineHeight = 1.22,
  letterSpacing = 0,
  color = "#000000",
  iconColor = "#000000",
  arrowSize = 20,
  avatarSrc = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face",
  avatarSize = 34,
  width = "220px",
  height = "fit-content",
  display = "flex",
  alignItems = "center",
  justifyContent = "flex-start",
  gap = 10,
  padding = 0,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin = 0,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  background = "transparent",
  borderRadius = 0,
  borderColor = "transparent",
  borderWidth = 0,
  borderStyle = "solid",
  boxShadow = "none",
  opacity = 1,
  overflow = "visible",
  position = "relative",
  top = "auto",
  right = "auto",
  bottom = "auto",
  left = "auto",
  zIndex = 0,
  rotation = 0,
  customClassName = "",
  interactive = true,
  accountHref = "/m_dashboard/profile",
  nodeId,
}: ProfileLoginBlockProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [siteIdentifier, setSiteIdentifier] = React.useState<string | null>(null);
  const [formMode, setFormMode] = React.useState<"login" | "register">("login");
  const [formName, setFormName] = React.useState("");
  const [formEmail, setFormEmail] = React.useState("");
  const [formPassword, setFormPassword] = React.useState("");
  const [avatarErrored, setAvatarErrored] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const isPublishedSite = !!siteIdentifier;

  React.useEffect(() => {
    if (!interactive) return;
    const detectedIdentifier = getPublishedSiteIdentifier();
    setSiteIdentifier(detectedIdentifier);
    setCurrentUser(
      detectedIdentifier ? getStoredPublishedSiteUser(detectedIdentifier) : getStoredUser()
    );
  }, [interactive]);

  React.useEffect(() => {
    if (!interactive) return;

    let cancelled = false;
    const loadUser = isPublishedSite
      ? getPublishedSiteMe(siteIdentifier)
      : getMe();

    loadUser
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.user) setCurrentUser(res.user);
        else setCurrentUser(null);
      })
      .catch(() => {
        if (!cancelled) setCurrentUser(null);
      });

    return () => {
      cancelled = true;
    };
  }, [interactive, isPublishedSite, siteIdentifier]);

  React.useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  const p = typeof padding === "number" ? padding : 0;
  const pt = paddingTop ?? p;
  const pr = paddingRight ?? p;
  const pb = paddingBottom ?? p;
  const pl = paddingLeft ?? p;

  const m = typeof margin === "number" ? margin : 0;
  const mt = marginTop ?? m;
  const mr = marginRight ?? m;
  const mb = marginBottom ?? m;
  const ml = marginLeft ?? m;

  const safeLineHeight = typeof lineHeight === "number" ? Math.max(1.1, lineHeight) : lineHeight;
  const resolvedFontSize = typeof fontSize === "number" ? fontSize : 34;
  const resolvedWidth = typeof width === "number" ? `${width}px` : width;
  const resolvedHeight = typeof height === "number" ? `${height}px` : height;
  const displayText = getUserLabel(currentUser, text);
  const displayAvatar = getUserAvatar(currentUser, avatarSrc);
  const initials = displayText.trim().slice(0, 1).toUpperCase() || "U";

  React.useEffect(() => {
    setAvatarErrored(false);
  }, [displayAvatar]);

  const stopEvent = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleToggleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!interactive) return;
    stopEvent(event);
    setError("");
    setMenuOpen((open) => !open);
  };

  const handleGoogleSignIn = async (event: React.MouseEvent<HTMLButtonElement>) => {
    stopEvent(event);
    setBusy(true);
    setError("");
    try {
      const response = await loginWithGoogle();
      if (!response.success || !response.user) {
        throw new Error(response.message || "Google sign-in failed.");
      }
      setCurrentUser(response.user);
      setMenuOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const handlePublishedAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    stopEvent(event);
    setBusy(true);
    setError("");

    try {
      if (!siteIdentifier) {
        throw new Error("Published site could not be identified.");
      }

      const response =
        formMode === "register"
          ? await registerPublishedSiteUser({
              name: formName,
              email: formEmail,
              password: formPassword,
              siteIdentifier,
            })
          : await loginPublishedSiteUser({
              email: formEmail,
              password: formPassword,
              siteIdentifier,
            });

      if (!response.success || !response.user) {
        throw new Error(
          response.message ||
            (formMode === "register" ? "Account creation failed." : "Login failed.")
        );
      }

      setCurrentUser(response.user);
      setFormPassword("");
      setMenuOpen(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : formMode === "register"
            ? "Account creation failed."
            : "Login failed."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleOpenAccount = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopEvent(event);
    setMenuOpen(false);
    router.push(accountHref);
  };

  const handleLogout = async (event: React.MouseEvent<HTMLButtonElement>) => {
    stopEvent(event);
    setBusy(true);
    setError("");
    try {
      if (isPublishedSite) {
        await logoutPublishedSiteUser(siteIdentifier);
      } else {
        await logout();
      }
      setCurrentUser(null);
      setMenuOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className={customClassName}
      data-node-id={nodeId}
      data-node-type="ProfileLogin"
      style={{
        position,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? right : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? left : undefined,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        marginTop: `${mt}px`,
        marginRight: `${mr}px`,
        marginBottom: `${mb}px`,
        marginLeft: `${ml}px`,
      }}
    >
      <button
        type="button"
        onClick={handleToggleMenu}
        disabled={!interactive}
        style={{
          display: display === "inline-flex" ? "flex" : display,
          alignItems,
          justifyContent,
          gap: `${gap || 0}px`,
          backgroundColor: background,
          paddingTop: `${pt}px`,
          paddingRight: `${pr}px`,
          paddingBottom: `${pb}px`,
          paddingLeft: `${pl}px`,
          borderRadius: `${borderRadius}px`,
          border: borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : "none",
          boxShadow,
          opacity,
          overflow,
          cursor: interactive ? "pointer" : "default",
          width: resolvedWidth,
          minWidth: 0,
          height: resolvedHeight,
          boxSizing: "border-box",
          whiteSpace: "nowrap",
          flexWrap: "nowrap",
          appearance: "none",
          textAlign: "left",
        }}
      >
        {!avatarErrored ? (
          <img
            src={displayAvatar}
            alt={currentUser ? `${displayText} avatar` : "Profile"}
            onError={() => setAvatarErrored(true)}
            style={{
              width: `${avatarSize}px`,
              height: `${avatarSize}px`,
              borderRadius: "999px",
              objectFit: "cover",
              backgroundColor: "#d1d5db",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{
              width: `${avatarSize}px`,
              height: `${avatarSize}px`,
              borderRadius: "999px",
              backgroundColor: "#d1d5db",
              color: "#111827",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: `${Math.max(12, Math.round(avatarSize * 0.45))}px`,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
        )}

        <span
          style={{
            display: "block",
            margin: 0,
            padding: 0,
            fontFamily,
            fontWeight,
            fontStyle,
            fontSize: `${resolvedFontSize}px`,
            lineHeight: safeLineHeight,
            letterSpacing: typeof letterSpacing === "number" ? letterSpacing : 0,
            color,
            whiteSpace: "nowrap",
            overflow: "visible",
            userSelect: "none",
          }}
        >
          {displayText}
        </span>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: `${arrowSize}px`,
            height: `${arrowSize}px`,
            marginLeft: "auto",
            transform: `rotate(${menuOpen ? 270 : 90}deg)`,
            color: iconColor,
            flexShrink: 0,
            transition: "transform 160ms ease",
          }}
        >
          <ChevronRight size={arrowSize} />
        </div>
      </button>

      {interactive && menuOpen ? (
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            left: 0,
            minWidth: typeof resolvedWidth === "string" ? resolvedWidth : "220px",
            maxWidth: "min(320px, 92vw)",
            background: "#ffffff",
            border: "1px solid rgba(15, 23, 42, 0.12)",
            borderRadius: "14px",
            boxShadow: "0 18px 48px rgba(15, 23, 42, 0.16)",
            padding: "10px",
            zIndex: 1000,
            boxSizing: "border-box",
          }}
        >
          {error ? (
            <div
              style={{
                marginBottom: "10px",
                borderRadius: "10px",
                background: "#fff1f2",
                color: "#be123c",
                fontSize: "12px",
                lineHeight: 1.45,
                padding: "8px 10px",
              }}
            >
              {error}
            </div>
          ) : null}

          {!currentUser ? (
            isPublishedSite ? (
              <form onSubmit={handlePublishedAuthSubmit}>
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    marginBottom: "10px",
                    borderRadius: "10px",
                    background: "#f8fafc",
                    padding: "4px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setFormMode("login")}
                    style={{
                      flex: 1,
                      border: "none",
                      borderRadius: "8px",
                      background: formMode === "login" ? "#ffffff" : "transparent",
                      color: "#111827",
                      padding: "8px 10px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormMode("register")}
                    style={{
                      flex: 1,
                      border: "none",
                      borderRadius: "8px",
                      background: formMode === "register" ? "#ffffff" : "transparent",
                      color: "#111827",
                      padding: "8px 10px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Create account
                  </button>
                </div>

                {formMode === "register" ? (
                  <input
                    type="text"
                    value={formName}
                    onChange={(event) => setFormName(event.target.value)}
                    placeholder="Full name"
                    autoComplete="name"
                    style={{
                      width: "100%",
                      border: "1px solid rgba(15, 23, 42, 0.12)",
                      borderRadius: "10px",
                      background: "#ffffff",
                      color: "#111827",
                      padding: "10px 12px",
                      fontSize: "14px",
                      marginBottom: "8px",
                      boxSizing: "border-box",
                    }}
                  />
                ) : null}

                <input
                  type="email"
                  value={formEmail}
                  onChange={(event) => setFormEmail(event.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  style={{
                    width: "100%",
                    border: "1px solid rgba(15, 23, 42, 0.12)",
                    borderRadius: "10px",
                    background: "#ffffff",
                    color: "#111827",
                    padding: "10px 12px",
                    fontSize: "14px",
                    marginBottom: "8px",
                    boxSizing: "border-box",
                  }}
                />

                <input
                  type="password"
                  value={formPassword}
                  onChange={(event) => setFormPassword(event.target.value)}
                  placeholder="Password"
                  autoComplete={formMode === "register" ? "new-password" : "current-password"}
                  style={{
                    width: "100%",
                    border: "1px solid rgba(15, 23, 42, 0.12)",
                    borderRadius: "10px",
                    background: "#ffffff",
                    color: "#111827",
                    padding: "10px 12px",
                    fontSize: "14px",
                    marginBottom: "10px",
                    boxSizing: "border-box",
                  }}
                />

                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: "10px",
                    background: "#111827",
                    color: "#ffffff",
                    padding: "10px 12px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: busy ? "wait" : "pointer",
                  }}
                >
                  {busy
                    ? formMode === "register"
                      ? "Creating account..."
                      : "Signing in..."
                    : formMode === "register"
                      ? "Create account"
                      : "Sign in"}
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={busy}
                style={{
                  width: "100%",
                  border: "1px solid rgba(15, 23, 42, 0.12)",
                  borderRadius: "10px",
                  background: "#ffffff",
                  color: "#111827",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: busy ? "wait" : "pointer",
                }}
              >
                <Google size={18} />
                {busy ? "Signing in..." : "Continue with Google"}
              </button>
            )
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "6px 4px 12px",
                  borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "999px",
                    overflow: "hidden",
                    background: "#e5e7eb",
                    flexShrink: 0,
                  }}
                >
                  {!avatarErrored ? (
                    <img
                      src={displayAvatar}
                      alt={`${displayText} avatar`}
                      onError={() => setAvatarErrored(true)}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {initials}
                    </div>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#111827",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {displayText}
                  </div>
                  {currentUser.email ? (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {currentUser.email}
                    </div>
                  ) : null}
                </div>
              </div>

              {!isPublishedSite ? (
                <button
                  type="button"
                  onClick={handleOpenAccount}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: "10px",
                    background: "#f8fafc",
                    color: "#111827",
                    padding: "10px 12px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  My account
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                disabled={busy}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: "10px",
                  background: "transparent",
                  color: "#b91c1c",
                  padding: "10px 12px",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: busy ? "wait" : "pointer",
                }}
              >
                {busy ? "Signing out..." : "Log out"}
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

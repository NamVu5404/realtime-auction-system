import {
  DashboardOutlined,
  LogoutOutlined,
  SearchOutlined,
  SettingOutlined,
  ShopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { InputRef } from "antd";
import { Avatar, Dropdown, Input, Layout, MenuProps, Space, Spin } from "antd";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import GoogleLoginButton from "../../auth/GoogleLoginButton";
import { useAuth } from "../../hooks/useAuth";
import { useNotificationWebSocket } from "../../hooks/useNotificationWebSocket";
import { getAvatarUrl } from "../../utils/imageUtils";
import NotificationBell from "../common/NotificationBell";

const { Header: AntHeader } = Layout;

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Auctions", path: "/auctions" },
  { label: "About Us", path: "https://auctionpro-psi.vercel.app/about-us/" },
];

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef<InputRef>(null);

  const [scrolled, setScrolled] = useState(false);

  useNotificationWebSocket();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    const q = value.trim();
    if (!q) return;
    navigate(`/auctions?q=${encodeURIComponent(q)}`);
    setSearchValue("");
    setSearchOpen(false);
  };

  const userMenuItems: MenuProps["items"] = [
    ...(user?.roles?.includes("ADMIN")
      ? [
          {
            key: "admin",
            label: "Admin Dashboard",
            icon: <DashboardOutlined />,
            onClick: () => navigate("/admin"),
          },
        ]
      : []),
    ...(user?.roles?.includes("SELLER")
      ? [
          {
            key: "seller",
            label: "Seller Dashboard",
            icon: <ShopOutlined />,
            onClick: () => navigate("/seller"),
          },
        ]
      : []),
    ...(user?.roles?.includes("ADMIN") || user?.roles?.includes("SELLER")
      ? [{ type: "divider" as const }]
      : []),
    {
      key: "account",
      label: "Account Settings",
      icon: <SettingOutlined />,
      onClick: () => navigate("/account/profile"),
    },
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <>
      <div
        className="header-gradient-overlay"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "120px",
          pointerEvents: "none",
          zIndex: 49,
          opacity: scrolled ? 0 : 1,
          transition: "opacity 0.3s ease",
        }}
      />
      <AntHeader
        style={{
          background: scrolled ? "rgba(15,17,26,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          transition:
            "background 0.5s ease, border-color 0.5s ease, box-shadow 0.3s ease",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: "64px",
          gap: "0",
        }}
      >
        {/* LEFT — logo + search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              gap: "7px",
            }}
            onClick={() => navigate("/")}
          >
            <img
              src={logo}
              alt="AuctionPro"
              style={{ height: "27px", objectFit: "contain" }}
            />
            <span
              className="hidden sm:block"
              style={{
                fontSize: "19px",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                background: "linear-gradient(135deg, #FED469 0%, #FEECBB 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AuctionPro
            </span>
          </div>

          {/* Search — desktop */}
          <div className="hidden md:block">
            <Input
              prefix={
                <SearchOutlined style={{ color: "#fff", fontSize: "12px" }} />
              }
              placeholder="Search auctions..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onPressEnter={() => handleSearch(searchValue)}
              style={{
                border: "1px solid #fff",
                color: "#fff",
                fontSize: "12.5px",
                height: "34px",
                width: "200px",
              }}
            />
          </div>

          {/* Search icon — mobile */}
          <button
            className="md:hidden"
            onClick={() => setSearchOpen((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.65)",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <SearchOutlined style={{ fontSize: "17px" }} />
          </button>
        </div>

        {/* CENTER — nav links */}
        <nav
          className="hidden md:flex"
          style={{
            flex: 1,
            justifyContent: "flex-start",
            alignItems: "center",
            paddingLeft: "32px",
            gap: "2px",
          }}
        >
          {NAV_LINKS.map((link) => {
            const isExternal = link.path.startsWith("http");

            const active = isExternal
              ? true
              : link.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(link.path);

            const handleClick = () => {
              if (isExternal) {
                window.open(link.path, "_blank", "noreferrer");
              } else {
                navigate(link.path);
              }
            };

            return (
              <span
                key={link.path}
                onClick={handleClick}
                style={{
                  cursor: "pointer",
                  padding: "4px 14px",
                  fontSize: "14px",
                  fontWeight: active ? 600 : 500,
                  color: active ? "var(--color-gold-start)" : "#fff",
                  transition: "color 0.15s",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLSpanElement).style.color =
                      "var(--color-gold-start)";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLSpanElement).style.color = "#fff";
                }}
              >
                {link.label}
              </span>
            );
          })}
        </nav>

        {/* Right */}
        <Space
          size={10}
          align="center"
          style={{ flexShrink: 0, display: "flex", alignItems: "center" }}
        >
          {isAuthenticated && user && (
            <div
              style={{ display: "flex", alignItems: "center", height: "42px" }}
            >
              <NotificationBell />
            </div>
          )}
          {isAuthenticated && user ? (
            <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  padding: "4px 10px 4px 4px",
                  borderRadius: "100px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  transition: "all 0.15s",
                }}
                className="hover:border-[rgba(254,212,105,0.25)] hover:bg-[rgba(254,212,105,0.04)]"
              >
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  src={getAvatarUrl(user.avatarUrl)}
                  style={{
                    background: "rgba(254,212,105,0.1)",
                    border: "1px solid rgba(254,212,105,0.35)",
                    color: "#FED469",
                    flexShrink: 0,
                  }}
                />
                <div className="hidden sm:block">
                  <p
                    style={{
                      color: "#fff",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      lineHeight: 1.2,
                      margin: 0,
                    }}
                  >
                    {user.name}
                  </p>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.38)",
                      fontSize: "11px",
                      lineHeight: 1.2,
                      margin: 0,
                    }}
                  >
                    {user.email}
                  </p>
                </div>
              </div>
            </Dropdown>
          ) : (
            <Spin spinning={loading}>
              <GoogleLoginButton />
            </Spin>
          )}
        </Space>
      </AntHeader>

      {/* Mobile search dropdown */}
      {searchOpen && (
        <div
          className="md:hidden"
          style={{
            position: "sticky",
            top: "64px",
            zIndex: 49,
            padding: "10px 16px",
            backdropFilter: "blur(20px)",
          }}
        >
          <Input
            ref={searchRef}
            prefix={<SearchOutlined style={{ color: "#fff" }} />}
            placeholder="Search auctions..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onPressEnter={() => handleSearch(searchValue)}
            style={{
              color: "#fff",
              fontSize: "14px",
            }}
          />
        </div>
      )}
    </>
  );
};

export default Header;

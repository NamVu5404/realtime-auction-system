import {
  DashboardOutlined,
  LogoutOutlined,
  MenuOutlined,
  SearchOutlined,
  SettingOutlined,
  ShopOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  HomeOutlined,
  UnorderedListOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { InputRef } from "antd";
import { Avatar, Drawer, Dropdown, Input, Layout, MenuProps, Spin } from "antd";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import logo from "../../assets/images/logo.png";
import GoogleLoginButton from "../../auth/GoogleLoginButton";
import { useAuth } from "../../hooks/useAuth";
import { useDebounce } from "../../hooks/useDebounce";
import { auctionApi } from "../../api/auctionApi";
import { useNotificationWebSocket } from "../../hooks/useNotificationWebSocket";
import { getAvatarUrl, getImageUrl } from "../../utils/imageUtils";
import { formatCurrency } from "../../utils/format";
import NotificationBell from "../common/NotificationBell";

const { Header: AntHeader } = Layout;

const NAV_LINKS = [
  { label: "Home", path: "/", authOnly: false },
  { label: "Auctions", path: "/auctions", authOnly: false },
  { label: "Participated", path: "/participated", authOnly: true },
  { label: "About Us", path: "https://auctionpro-psi.vercel.app/about-us/", authOnly: false },
];

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef<InputRef>(null);

  const [scrolled, setScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerEverOpened, setDrawerEverOpened] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("search-history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const debouncedSearch = useDebounce(searchValue, 300);

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ["searchAuctions", debouncedSearch],
    queryFn: () => auctionApi.searchAuctions(debouncedSearch, 1, 5),
    enabled: debouncedSearch.trim().length > 0,
    staleTime: 60000,
  });

  useNotificationWebSocket();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  const saveToSearchHistory = (keyword: string) => {
    const q = keyword.trim();
    if (!q) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item !== q);
      const updated = [q, ...filtered].slice(0, 5);
      localStorage.setItem("search-history", JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromSearchHistory = (e: React.MouseEvent, keyword: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item !== keyword);
      localStorage.setItem("search-history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const closeDropdown = () => {
    setSearchOpen(false);
    setIsSearchFocused(false);
    setSearchValue("");
  };

  const handleSearchSubmit = (value: string) => {
    const q = value.trim();
    if (!q) return;
    saveToSearchHistory(q);
    navigate(`/auctions?q=${encodeURIComponent(q)}`);
    closeDropdown();
  };

  const handleResultClick = (id: number, title: string) => {
    saveToSearchHistory(title);
    navigate(`/auction/${id}`);
    closeDropdown();
  };

  // Inline JSX — NOT a sub-component to avoid unmount/remount on every keystroke
  const searchDropdownJSX = (() => {
    const showDropdown = isSearchFocused;
    if (!showDropdown) return null;

    if (debouncedSearch) {
      const hasResults = searchResults?.data && searchResults.data.length > 0;
      return (
        <div
          className="absolute left-0 w-full bg-[var(--color-card-high)] border border-[var(--color-border-md)] rounded-md overflow-hidden z-[9999] flex flex-col text-left shadow-2xl"
          style={{ top: "calc(100% - 5px)" }}
        >
          {isSearching ? (
            <div className="p-4 text-center">
              <Spin size="small" />
            </div>
          ) : hasResults ? (
            <>
              {searchResults!.data.map((auction) => {
                const imgSrc = getImageUrl(auction.image);
                return (
                  <div
                    key={auction.id}
                    className="flex items-center gap-3 px-3 py-4 cursor-pointer hover:bg-[var(--color-card-hover)] border-b border-[var(--color-border-md)] transition-colors last:border-b-0"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleResultClick(auction.id, auction.title);
                    }}
                  >
                    <img
                      src={imgSrc}
                      alt={auction.title}
                      className="w-10 h-8 rounded shrink-0 object-cover bg-[var(--color-bg)]"
                    />
                    <div className="flex flex-col flex-1 min-w-0 justify-center">
                      <div
                        className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate w-full leading-tight mb-0.5"
                        title={auction.title}
                      >
                        {auction.title}
                      </div>
                      <div className="flex items-center text-[11px] leading-tight">
                        <span
                          className="font-bold"
                          style={{ color: "var(--color-gold-start)" }}
                        >
                          {formatCurrency(auction.currentPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div
                className="flex items-center justify-center gap-2 h-9 cursor-pointer text-[var(--color-text-secondary)] hover:text-[var(--color-gold-start)] hover:bg-[var(--color-card-hover)] transition-colors border-t border-[var(--color-border-md)] bg-[var(--color-card)]"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSearchSubmit(debouncedSearch);
                }}
              >
                <SearchOutlined className="text-[14px]" />
                <span className="text-[12px] leading-none">
                  View all results
                </span>
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-[13px] text-[var(--color-text-muted)]">
              No results found for "{debouncedSearch}"
            </div>
          )}
        </div>
      );
    }

    if (searchHistory.length === 0) return null;

    return (
      <div
        className="absolute left-0 w-full bg-[var(--color-card-high)] border border-[var(--color-border-md)] rounded-md overflow-hidden z-[9999] flex flex-col text-left shadow-2xl"
        style={{ top: "calc(100% - 5px)" }}
      >
        {searchHistory.map((item, idx) => (
          <div
            key={`${item}-${idx}`}
            className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-[var(--color-card-hover)] transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              setSearchValue(item);
              handleSearchSubmit(item);
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0 text-[var(--color-text-secondary)] text-[13px]">
              <ClockCircleOutlined className="text-[14px] shrink-0" />
              <span className="truncate block leading-tight">{item}</span>
            </div>
            <CloseOutlined
              className="text-[var(--color-text-secondary)] text-[12px] p-1 shrink-0 hover:text-[var(--color-accent-red)] transition-colors"
              onMouseDown={(e) => removeFromSearchHistory(e, item)}
            />
          </div>
        ))}
      </div>
    );
  })();

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
        className="header-root"
        style={{
          background: scrolled ? "rgba(15,17,26,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          transition:
            "background 0.5s ease, border-color 0.5s ease, box-shadow 0.3s ease",
          display: "flex",
          alignItems: "center",
          overflowX: "clip" as "hidden",
          overflowY: "visible",
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
            gap: "10px",
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              gap: "7px",
              flexShrink: 0,
            }}
            onClick={() => navigate("/")}
          >
            <img
              src={logo}
              alt="AuctionPro"
              style={{ height: "32px", objectFit: "contain" }}
            />
            <span
              className="hidden sm:block"
              style={{
                fontSize: "24px",
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

          {/* Search — desktop full input */}
          <div className="hidden md:block" style={{ position: "relative" }}>
            <Input
              prefix={
                <SearchOutlined style={{ color: "#fff", fontSize: "12px" }} />
              }
              placeholder="Search auctions..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onPressEnter={() => handleSearchSubmit(searchValue)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              style={{
                border: "1px solid #fff",
                color: "#fff",
                fontSize: "12.5px",
                height: "32px",
                width: "320px",
              }}
              allowClear
            />
            {searchDropdownJSX}
          </div>

          {/* Search — mobile inline Input (luôn hiện, gõ thẳng) */}
          <div className="md:hidden" style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <Input
              ref={searchRef}
              prefix={<SearchOutlined style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }} />}
              placeholder="Search auctions..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onPressEnter={() => handleSearchSubmit(searchValue)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
                fontSize: "12px",
                height: "32px",
              }}
              allowClear
            />
            {searchDropdownJSX}
          </div>
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
          {NAV_LINKS.filter((link) => !link.authOnly || isAuthenticated).map((link) => {
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
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          {isAuthenticated && user && <NotificationBell />}

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden"
            onClick={() => { setMobileMenuOpen(true); setDrawerEverOpened(true); }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.75)",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <MenuOutlined style={{ fontSize: "20px" }} />
          </button>

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
                className="header-avatar-btn hover:border-[rgba(254,212,105,0.25)] hover:bg-[rgba(254,212,105,0.04)]"
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
                  <p style={{ color: "#fff", fontSize: "12.5px", fontWeight: 600, lineHeight: 1.2, margin: 0 }}>
                    {user.name}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "11px", lineHeight: 1.2, margin: 0 }}>
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
        </div>
      </AntHeader>

      {/* Mobile nav drawer — chỉ mount sau lần mở đầu tiên, tránh panel tồn tại trong DOM khi chưa cần */}
      {drawerEverOpened && (
      <Drawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        placement="right"
        styles={{ wrapper: { width: 280 } }}
        title={
          <span style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>
            Menu
          </span>
        }
        className="mobile-nav-drawer"
        closeIcon={<CloseOutlined style={{ color: "var(--color-text-secondary)" }} />}
      >
        {NAV_LINKS.filter((link) => !link.authOnly || isAuthenticated).map((link) => {
          const isExternal = link.path.startsWith("http");
          const active = isExternal
            ? false
            : link.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(link.path);

          const icon =
            link.path === "/" ? <HomeOutlined /> :
            link.path === "/auctions" ? <UnorderedListOutlined /> :
            link.path === "/participated" ? <HistoryOutlined /> :
            <InfoCircleOutlined />;

          const handleClick = () => {
            setMobileMenuOpen(false);
            if (isExternal) window.open(link.path, "_blank", "noreferrer");
            else navigate(link.path);
          };

          return (
            <div
              key={link.path}
              className={`mobile-nav-link${active ? " mobile-nav-link--active" : ""}`}
              onClick={handleClick}
            >
              {icon}
              {link.label}
            </div>
          );
        })}

        {isAuthenticated && (
          <div
            className="mobile-nav-link"
            onClick={() => { setMobileMenuOpen(false); navigate("/account/profile"); }}
          >
            <SettingOutlined />
            Account Settings
          </div>
        )}
      </Drawer>
      )}

    </>
  );
};

export default Header;

import {
  DashboardOutlined,
  LogoutOutlined,
  SettingOutlined,
  ShopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Layout, MenuProps, Space, Spin } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleLoginButton from "../../auth/GoogleLoginButton";
import { useAuth } from "../../hooks/useAuth";
import { getAvatarUrl } from "../../utils/imageUtils";

const { Header: AntHeader } = Layout;

export const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      navigate("/");
    } finally {
      setLoading(false);
    }
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
    <AntHeader
      style={{
        background: "#0F111A",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 32px",
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: "64px",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          gap: "10px",
        }}
        onClick={() => navigate("/")}
      >
        <span style={{ fontSize: "24px" }}>⚡</span>
        <span
          style={{
            fontSize: "24px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #FED469 0%, #FEECBB 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          AuctionPro
        </span>
      </div>

      {/* Right */}
      <Space size={12}>
        {isAuthenticated && user ? (
          <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                padding: "5px 14px 5px 6px",
                borderRadius: "100px",
                border: "0.5px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
              }}
              className="hover:border-[rgba(254,212,105,0.3)] hover:bg-[rgba(254,212,105,0.05)]"
            >
              <Avatar
                size={34}
                icon={<UserOutlined />}
                src={getAvatarUrl(user.avatarUrl)}
                alt={user.name}
                style={{
                  background: "rgba(254,212,105,0.12)",
                  border: "0.5px solid rgba(254,212,105,0.4)",
                  color: "#FED469",
                  flexShrink: 0,
                }}
              />
              <div className="hidden sm:block">
                <p
                  style={{
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    lineHeight: 1.2,
                    margin: 0,
                  }}
                >
                  {user.name}
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,0.4)",
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
  );
};

export default Header;

import {
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
  HistoryOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Grid, Menu } from "antd";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

const { useBreakpoint } = Grid;

const AccountSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const screens = useBreakpoint();
  const [selectedKey, setSelectedKey] = useState(location.pathname);

  // Determine if we are on mobile/small screen
  const isMobile = !screens.lg;

  useEffect(() => {
    setSelectedKey(location.pathname);
  }, [location.pathname]);

  const menuItems = [
    {
      key: "general",
      label: isMobile ? null : "General",
      type: "group" as const,
      children: [
        {
          key: "/account/profile",
          icon: <UserOutlined />,
          label: "Profile",
          onClick: () => navigate("/account/profile"),
        },
        {
          key: "/account/identity-verification",
          icon: <IdcardOutlined />,
          label: "Identity Verification",
          onClick: () => navigate("/account/identity-verification"),
        },
        {
          key: "/account/notifications",
          icon: <BellOutlined />,
          label: "Notifications",
          onClick: () => navigate("/account/notifications"),
        },
      ],
    },
    {
      key: "activity",
      label: isMobile ? null : "Activity",
      type: "group" as const,
      children: [
        {
          key: "/account/bid-stats",
          icon: <BarChartOutlined />,
          label: "Bid Statistics",
          onClick: () => navigate("/account/bid-stats"),
        },
        {
          key: "/account/bids",
          icon: <HistoryOutlined />,
          label: "My Bids",
          onClick: () => navigate("/account/bids"),
        },
        {
          key: "/account/seller-reg",
          icon: <ShopOutlined />,
          label: isMobile ? "Register" : "Seller Registration",
          onClick: () => navigate("/account/seller-reg"),
        },
      ],
    },
    {
      key: "security",
      label: isMobile ? null : "Security",
      type: "group" as const,
      children: [
        {
          key: "/account/2fa",
          icon: <SafetyCertificateOutlined />,
          label: isMobile ? "2FA" : "Two-factor Authentication",
          onClick: () => navigate("/account/2fa"),
        },
        {
          key: "/account/security-logs",
          icon: <AuditOutlined />,
          label: "Security Logs",
          onClick: () => navigate("/account/security-logs"),
        },
      ],
    },
  ];

  return (
    <div
      style={{
        background: "#0F111A",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "12px",
        height: "fit-content",
        position: isMobile ? "static" : "sticky",
        top: isMobile ? "0" : "84px",
        width: isMobile ? "100%" : "280px",
        flexShrink: 0,
      }}
    >
      <div style={{ padding: isMobile ? "8px" : "16px" }}>
        {!isMobile && (
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#fff",
              marginBottom: "16px",
              paddingLeft: "12px",
            }}
          >
            Account Settings
          </h2>
        )}
        <Menu
          mode={isMobile ? "horizontal" : "inline"}
          selectedKeys={[selectedKey]}
          style={{
            background: "transparent",
            borderRight: 0,
            borderBottom: 0,
          }}
          items={menuItems}
          inlineIndent={12}
          overflowedIndicator={<SettingOutlined style={{ color: "#fff" }} />}
        />
      </div>
    </div>
  );
};

export default AccountSidebar;

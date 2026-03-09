import {
  AuditOutlined,
  DashboardOutlined,
  HomeOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Breadcrumb, Dropdown, Layout, Menu } from "antd";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../store/useAuthStore";

const { Sider, Header, Content } = Layout;

const SellerLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { logout } = useAuth();

  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => navigate("/seller"),
    },
    {
      key: "auctions",
      icon: <AuditOutlined />,
      label: "Auction Management",
      onClick: () => navigate("/seller/auctions"),
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userMenuItems = [
    {
      key: "home",
      label: "Home Page",
      icon: <HomeOutlined />,
      onClick: () => navigate("/"),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
      danger: true,
    },
  ];

  const pathSnippets = location.pathname.split("/").filter((i) => i);
  const breadcrumbItems = pathSnippets.map((snippet, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join("/")}`;
    return {
      title: snippet.charAt(0).toUpperCase() + snippet.slice(1),
      href: url,
    };
  });

  return (
    <Layout style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Glass Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        style={{
          borderRight: "1px solid rgba(255,255,255,0.04)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: collapsed ? "20px 0" : "18px 20px",
            textAlign: collapsed ? "center" : "left",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            marginBottom: "8px",
          }}
        >
          {collapsed ? (
            <span
              style={{ fontSize: "18px", cursor: "pointer" }}
              onClick={() => navigate("/seller")}
            >
              ⚡
            </span>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                gap: "10px",
              }}
              onClick={() => navigate("/seller")}
            >
              <span style={{ fontSize: "18px" }}>⚡</span>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  background:
                    "linear-gradient(135deg, #FED469 0%, #FEECBB 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Seller Panel
              </span>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname.split("/")[2] || "dashboard"]}
          items={menuItems}
          style={{ background: "transparent", border: "none" }}
        />
      </Sider>

      <Layout style={{ background: "var(--color-bg)" }}>
        {/* Sticky blurred header */}
        <Header
          style={{
            background: "#0F111A",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 24px",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
        >
          <Breadcrumb items={breadcrumbItems} />

          <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                padding: "6px 14px 6px 6px",
                borderRadius: "100px",
                border: "0.5px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.03)",
                transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
              }}
              className="hover:border-[rgba(254,212,105,0.3)] hover:bg-[rgba(254,212,105,0.05)]"
            >
              <Avatar
                size="default"
                icon={<UserOutlined />}
                src={user?.avatarUrl}
                alt={user?.name}
                style={{
                  background: "rgba(254,212,105,0.12)",
                  border: "0.5px solid rgba(254,212,105,0.4)",
                  color: "#FED469",
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
                  {user?.name}
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "11px",
                    lineHeight: 1.2,
                    margin: 0,
                  }}
                >
                  {user?.email}
                </p>
              </div>
            </div>
          </Dropdown>
        </Header>

        <Content
          style={{
            background: "var(--color-bg)",
            padding: "28px",
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default SellerLayout;

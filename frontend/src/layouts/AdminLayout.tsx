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

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { logout } = useAuth();

  const menuItems = [
    // {
    //   key: "dashboard",
    //   icon: <DashboardOutlined />,
    //   label: "Dashboard",
    //   onClick: () => navigate("/admin"),
    // },
    {
      key: "users",
      icon: <UserOutlined />,
      label: "User Management",
      onClick: () => navigate("/admin/users"),
    },
    {
      key: "auctions",
      icon: <AuditOutlined />,
      label: "Auction Management",
      onClick: () => navigate("/admin/auctions"),
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

  // Generate breadcrumbs based on current path
  const pathSnippets = location.pathname.split("/").filter((i) => i);
  const breadcrumbItems = pathSnippets.map((snippet, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join("/")}`;
    return {
      title: snippet.charAt(0).toUpperCase() + snippet.slice(1),
      href: url,
    };
  });

  return (
    <Layout className="min-h-screen bg-black">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        className="bg-zinc-900 border-r border-zinc-700"
      >
        <div className="p-4 text-white font-bold text-2xl ml-2">
          {collapsed ? "⚡" : "Admin Panel"}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname.split("/")[2] || "dashboard"]}
          items={menuItems}
          className="bg-zinc-900 border-none"
        />
      </Sider>
      <Layout>
        <Header className="bg-zinc-900 border-b border-zinc-700 px-6 flex justify-between items-center">
          <Breadcrumb items={breadcrumbItems} className="text-white" />
          <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80">
              <Avatar
                size="large"
                icon={<UserOutlined />}
                src={user?.avatarUrl}
                alt={user?.name}
              />
              <div className="hidden sm:block">
                <p className="text-white text-sm font-medium">{user?.name}</p>
                <p className="text-gray-400 text-xs">{user?.email}</p>
              </div>
            </div>
          </Dropdown>
        </Header>
        <Content className="bg-black p-6 min-h-0 overflow-auto">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;

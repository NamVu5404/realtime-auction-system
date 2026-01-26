import {
  DashboardOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Layout, MenuProps, Space, Spin } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleLoginButton from "../../auth/GoogleLoginButton";
import { useAuth } from "../../hooks/useAuth";

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
    ...(user?.role === "ADMIN"
      ? [
          {
            key: "admin",
            label: "Admin Dashboard",
            icon: <DashboardOutlined />,
            onClick: () => navigate("/admin"),
          },
        ]
      : []),

    ...(user?.role === "ADMIN" ? [{ type: "divider" as const }] : []),

    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <AntHeader className="bg-gray-900 border-b border-gray-700 px-6 flex justify-between items-center sticky top-0 z-40">
      <div
        className="flex items-center cursor-pointer"
        onClick={() => navigate("/")}
      >
        <h1 className="text-white text-2xl font-bold">⚡ Auction Pro</h1>
      </div>

      <Space>
        {isAuthenticated && user ? (
          <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80">
              <Avatar
                size="large"
                icon={<UserOutlined />}
                src={user.avatarUrl}
                alt={user.name}
              />
              <div className="hidden sm:block">
                <p className="text-white text-sm font-medium">{user.name}</p>
                <p className="text-gray-400 text-xs">{user.email}</p>
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

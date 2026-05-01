import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import AccountSidebar from "./AccountSidebar";

const { Content } = Layout;

const AccountLayout = () => {
  return (
    <Layout
      style={{
        background: "transparent",
        minHeight: "100vh",
      }}
    >
      <div className="container mx-auto max-w-7xl px-4 py-6 md:px-0 md:py-10 flex flex-col lg:flex-row gap-6 md:gap-10">
        <AccountSidebar />
        <Content
          style={{
            flex: 1,
            background: "var(--color-card)",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            animation: "fadeIn 0.35s ease-out",
          }}
          className="p-5 md:p-8"
        >
          <Outlet />
        </Content>
      </div>
    </Layout>
  );
};

export default AccountLayout;

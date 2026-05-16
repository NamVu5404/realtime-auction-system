import { Layout } from "antd";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Outlet, useLocation } from "react-router-dom";

const { Content } = Layout;

const MainLayout = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <Layout
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg)",
      }}
    >
      <Header />
      <Content
        style={{
          flex: 1,
          background: "var(--color-bg)",
          paddingTop: isHome ? 0 : 64, // offset fixed header for content pages
        }}
      >
        <Outlet />
      </Content>
      <Footer />
    </Layout>
  );
};

export default MainLayout;

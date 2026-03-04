import { Layout } from "antd";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Outlet } from "react-router-dom";

const { Content } = Layout;

const MainLayout = () => {
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
      <Content style={{ flex: 1, background: "var(--color-bg)" }}>
        <Outlet />
      </Content>
      <Footer />
    </Layout>
  );
};

export default MainLayout;

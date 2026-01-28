import { Layout } from 'antd';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Outlet } from 'react-router-dom';

const { Content } = Layout;

const MainLayout = () => {
  return (
    <Layout className="min-h-screen flex flex-col bg-black">
      <Header />
      <Content className="flex-1 bg-black">
        <Outlet />
      </Content>
      <Footer />
    </Layout>
  );
};

export default MainLayout;
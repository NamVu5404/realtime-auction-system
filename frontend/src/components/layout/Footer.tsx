import { Layout } from 'antd';

const { Footer: AntFooter } = Layout;

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <AntFooter className="text-center bg-gray-900 border-t border-gray-700 text-gray-400">
      <p>© {currentYear} Real-time Auction Platform. All rights reserved.</p>
      <p className="text-xs mt-2">Built with React + Spring Boot</p>
    </AntFooter>
  );
};

export default Footer;

import {
  EnvironmentOutlined,
  FacebookFilled,
  InstagramOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  TwitterOutlined,
  YoutubeFilled,
} from "@ant-design/icons";
import { Col, Layout, Row, Space } from "antd";
import logo from "../../assets/images/logo.png";
import { ENV, buildPublicSiteUrl } from "../../config/env";
import { useNavigate } from "react-router-dom";

const { Footer: AntFooter } = Layout;

export const Footer = () => {
  const repoUrl = ENV.REPO_URL;
  const navigate = useNavigate();
  const links = {
    howToBid: buildPublicSiteUrl("/how-to-bid/"),
    buyersPremium: buildPublicSiteUrl("/buyers-premium/"),
    authentication: buildPublicSiteUrl("/authentication/"),
    shipping: buildPublicSiteUrl("/shipping/"),
    helpCenter: buildPublicSiteUrl("/help-center/"),
    aboutUs: buildPublicSiteUrl("/about-us/"),
    privacyPolicy: buildPublicSiteUrl("/privacy-policy/"),
    termsOfService: buildPublicSiteUrl("/terms-of-service/"),
    cookiePolicy: buildPublicSiteUrl("/cookie-policy/"),
  };

  return (
    <AntFooter
      style={{
        background: "#0F111A",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "60px 0 24px",
        color: "rgba(255,255,255,0.6)",
      }}
    >
      <div className="footer-inner" style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <Row gutter={[48, 40]}>
          {/* Brand & About */}
          <Col xs={24} sm={24} md={9}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                gap: "10px",
                marginBottom: "20px",
              }}
              onClick={() => navigate("/")}
            >
              <img
                src={logo}
                alt="AuctionPro Logo"
                style={{
                  height: "40px",
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
              />
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  background:
                    "linear-gradient(135deg, #FED469 0%, #FEECBB 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                AuctionPro
              </span>
            </div>
            <p className="text-[14px] leading-[1.8] text-white/55 mb-6 pr-4">
              The premier platform for high-end, real-time bidding on exclusive,
              luxury assets. Experience the thrill of live auctions from
              anywhere in the world with absolute security and transparency.
            </p>
            <Space size="middle">
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/55 hover:text-[#FED469] text-[18px] transition-colors duration-300"
              >
                <FacebookFilled />
              </a>
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/55 hover:text-[#FED469] text-[18px] transition-colors duration-300"
              >
                <TwitterOutlined />
              </a>
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/55 hover:text-[#FED469] text-[18px] transition-colors duration-300"
              >
                <InstagramOutlined />
              </a>
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/55 hover:text-[#FED469] text-[18px] transition-colors duration-300"
              >
                <YoutubeFilled />
              </a>
            </Space>
          </Col>

          {/* Categories */}
          <Col xs={12} sm={8} md={5}>
            <h4 className="text-white text-[15px] font-bold mb-6 tracking-wider uppercase">
              Categories
            </h4>
            <div className="flex flex-col space-y-3">
              <a
                href="#"
                className="text-white/55 hover:text-[#FED469] transition-colors duration-300 text-[13px]"
              >
                Fine Art & Paintings
              </a>
              <a
                href="#"
                className="text-white/55 hover:text-[#FED469] transition-colors duration-300 text-[13px]"
              >
                Luxury Watches
              </a>
              <a
                href="#"
                className="text-white/55 hover:text-[#FED469] transition-colors duration-300 text-[13px]"
              >
                Classic Cars
              </a>
              <a
                href="#"
                className="text-white/55 hover:text-[#FED469] transition-colors duration-300 text-[13px]"
              >
                Real Estate
              </a>
              <a
                href="#"
                className="text-white/55 hover:text-[#FED469] transition-colors duration-300 text-[13px]"
              >
                Rare Antiques
              </a>
            </div>
          </Col>

          {/* Support */}
          <Col xs={12} sm={8} md={5}>
            <h4 className="text-white text-[15px] font-bold mb-6 tracking-wider uppercase">
              Support
            </h4>
            <div className="flex flex-col space-y-3">
              <a
                href={links.howToBid}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/55 hover:text-[#FED469] transition-colors duration-300 text-[13px]"
              >
                How to Bid
              </a>
              <a
                href={links.buyersPremium}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/55 hover:text-[#FED469] transition-colors duration-300 text-[13px]"
              >
                Buyer's Premium
              </a>
              <a
                href={links.authentication}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/55 hover:text-[#FED469] transition-colors duration-300 text-[13px]"
              >
                Authentication Process
              </a>
              <a
                href={links.shipping}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/55 hover:text-[#FED469] transition-colors duration-300 text-[13px]"
              >
                Shipping & Delivery
              </a>
              <a
                href={links.helpCenter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/55 hover:text-[#FED469] transition-colors duration-300 text-[13px]"
              >
                Help Center & FAQ
              </a>
            </div>
          </Col>

          {/* Contact */}
          <Col xs={24} sm={8} md={5}>
            <h4 className="text-white text-[15px] font-bold mb-6 tracking-wider uppercase">
              Contact Us
            </h4>
            <div className="flex items-center mb-4">
              <TeamOutlined className="text-[#FED469] text-[16px] mr-3" />
              <a
                href={links.aboutUs}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/55 hover:text-[#FED469] transition-colors duration-300 text-[13px]"
              >
                About Us
              </a>
            </div>
            <div className="flex items-start mb-4">
              <EnvironmentOutlined className="text-[#FED469] text-[16px] mr-3 mt-1" />
              <span className="text-white/55 text-[13px] leading-relaxed">
                Ha Noi, Vietnam
              </span>
            </div>
            <div className="flex items-center mb-4">
              <PhoneOutlined className="text-[#FED469] text-[16px] mr-3" />
              <a
                href={ENV.CONTACT_PHONE_URL}
                className="text-white/55 hover:text-[#FED469] transition-colors duration-300 text-[13px]"
              >
                +84 9889 88888
              </a>
            </div>
            <div className="flex items-center">
              <MailOutlined className="text-[#FED469] text-[16px] mr-3" />
              <a
                href={ENV.CONTACT_EMAIL_URL}
                className="text-white/55 hover:text-[#FED469] transition-colors duration-300 text-[13px]"
              >
                contact@auctionpro.com
              </a>
            </div>
          </Col>
        </Row>

        {/* Bottom Banner */}
        <div className="border-t border-white/5 mt-[60px] pt-6 flex flex-wrap justify-between items-center gap-4">
          <p className="text-white/40 text-[12px] m-0">
            © 2026 AuctionPro. All rights reserved.
          </p>
          <div className="flex items-center space-x-4">
            <a
              href={links.privacyPolicy}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-[#FED469] transition-colors duration-300 text-[12px]"
            >
              Privacy Policy
            </a>
            <span className="text-white/10 text-[12px]">|</span>
            <a
              href={links.termsOfService}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-[#FED469] transition-colors duration-300 text-[12px]"
            >
              Terms of Service
            </a>
            <span className="text-white/10 text-[12px]">|</span>
            <a
              href={links.cookiePolicy}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-[#FED469] transition-colors duration-300 text-[12px]"
            >
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </AntFooter>
  );
};

export default Footer;

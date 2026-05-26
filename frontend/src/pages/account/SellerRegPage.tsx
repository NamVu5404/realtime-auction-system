import {
  CheckCircleFilled,
  ClockCircleOutlined,
  GlobalOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  message,
  Row,
  Space,
  Typography,
} from "antd";
import React from "react";
import sellerApi from "../../api/sellerApi";
import { RequestStatus, UserRole } from "../../api/types";
import sellerBg from "../../assets/images/seller-reg-bg.webp";
import { useAuthStore } from "../../store/useAuthStore";
import { ENV } from "../../config/env";

const { Title, Text, Paragraph } = Typography;

const SellerRegPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const isSeller = user?.roles?.includes(UserRole.SELLER);

  const { data: myReg, isLoading: isStatusLoading } = useQuery({
    queryKey: ["my-seller-registration"],
    queryFn: sellerApi.getMyRegistration,
    enabled: !!user && !isSeller,
  });

  const { mutate: register, isPending } = useMutation({
    mutationFn: sellerApi.registerSeller,
    onSuccess: (data) => {
      // Immediately update local cache to show Pending status
      queryClient.setQueryData(["my-seller-registration"], data);

      // Also invalidate to sync with server
      queryClient.invalidateQueries({ queryKey: ["my-seller-registration"] });

      message.success(data.message);
    },
    onError: (error: any) => {
      message.error(error.message);
    },
  });

  const getButtonState = () => {
    if (isSeller) {
      return {
        text: "Already a Seller",
        disabled: true,
        icon: <CheckCircleFilled />,
      };
    }
    if (myReg?.status === RequestStatus.PENDING) {
      return {
        text: "Pending Approval",
        disabled: true,
        icon: <ClockCircleOutlined />,
      };
    }
    return {
      text: "Apply as Seller",
      disabled: false,
      icon: <ShopOutlined />,
    };
  };

  const buttonState = getButtonState();

  const benefits = [
    {
      icon: <RocketOutlined style={{ fontSize: "24px", color: "#fed469" }} />,
      title: "Fast Listing",
      description:
        "Quickly list your products and start receiving real-time bids within minutes.",
    },
    {
      icon: <GlobalOutlined style={{ fontSize: "24px", color: "#fed469" }} />,
      title: "Wide Reach",
      description:
        "Access a global community of active bidders looking for unique items.",
    },
    {
      icon: (
        <SafetyCertificateOutlined
          style={{ fontSize: "24px", color: "#fed469" }}
        />
      ),
      title: "Secure Payments",
      description:
        "Guaranteed secure transactions and automated payment processing.",
    },
  ];

  return (
    <div className="seller-reg-container" style={{ color: "#fff" }}>
      {/* Hero Section */}
      <div
        style={{
          position: "relative",
          borderRadius: "16px",
          overflow: "hidden",
          marginBottom: "40px",
          height: "300px",
          display: "flex",
          alignItems: "center",
          padding: "0 40px",
          background: `linear-gradient(90deg, rgba(15,17,26,1) 0%, rgba(15,17,26,0.8) 50%, rgba(15,17,26,0) 100%), url(${sellerBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ maxWidth: "600px", zIndex: 1 }}>
          <Space direction="vertical" size="small">
            <span
              style={{
                color: "#fed469",
                fontWeight: 600,
                borderRadius: "4px",
              }}
            >
              SELLER PROGRAM
            </span>
            <Title
              level={1}
              style={{ color: "#fff", margin: 0, fontSize: "36px" }}
            >
              Sell Your Items <span style={{ color: "#fed469" }}>Faster</span>
            </Title>
            <Paragraph
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "18px",
                maxWidth: "500px",
              }}
            >
              Join our elite network of sellers and experience the power of
              real-time auctions.
            </Paragraph>
          </Space>
        </div>
      </div>

      <Row gutter={[32, 32]}>
        <Col xs={24} lg={14}>
          <Title level={3} style={{ color: "#fff", marginBottom: "24px" }}>
            Why sell on{" "}
            <span
              style={{
                fontSize: "24px",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                background: "linear-gradient(135deg, #FED469 0%, #FEECBB 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AuctionPro
            </span>
            ?
          </Title>
          <Row gutter={[24, 24]}>
            {benefits.map((item, index) => (
              <Col span={24} key={index}>
                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    padding: "24px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.05)",
                    transition: "all 0.3s ease",
                  }}
                  className="benefit-card"
                >
                  <div
                    style={{
                      padding: "12px",
                      background: "rgba(254, 212, 105, 0.1)",
                      borderRadius: "10px",
                      height: "fit-content",
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <Title
                      level={4}
                      style={{ color: "#fff", margin: "0 0 8px 0" }}
                    >
                      {item.title}
                    </Title>
                    <Text style={{ color: "rgba(255,255,255,0.5)" }}>
                      {item.description}
                    </Text>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            style={{
              background: "#191B24",
              border: "1px solid #fed469",
              borderRadius: "16px",
              padding: "12px",
              position: "sticky",
              top: "100px",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <ShopOutlined
                style={{
                  fontSize: "48px",
                  color: "#fed469",
                  marginBottom: "16px",
                }}
              />
              <Title level={3} style={{ color: "#fff", margin: 0 }}>
                Start Selling Today
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.5)" }}>
                Complete your registration in one click
              </Text>
            </div>

            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <CheckCircleFilled style={{ color: "#10B981" }} />
                <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                  Instant account verification
                </Text>
              </div>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <CheckCircleFilled style={{ color: "#10B981" }} />
                <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                  No registration fee
                </Text>
              </div>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <CheckCircleFilled style={{ color: "#10B981" }} />
                <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                  Access to professional tools
                </Text>
              </div>

              <Divider
                style={{
                  borderColor: "rgba(255,255,255,0.05)",
                  margin: "12px 0",
                }}
              />

              <Button
                type="primary"
                size="large"
                block
                loading={isPending || isStatusLoading}
                disabled={
                  buttonState.disabled ||
                  isPending ||
                  (!buttonState.disabled && !agreedToTerms)
                }
                style={{
                  height: "54px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: 700,
                  boxShadow:
                    buttonState.disabled || !agreedToTerms
                      ? "none"
                      : "0 8px 24px rgba(254, 212, 105, 0.25)",
                  transition: "all 0.3s ease",
                  ...(!buttonState.disabled && !agreedToTerms
                    ? {
                        background: "rgba(255, 255, 255, 0.05)",
                        borderColor: "rgba(255, 255, 255, 0.1)",
                        color: "rgba(255, 255, 255, 0.3)",
                      }
                    : {}),
                }}
                icon={buttonState.icon}
                onClick={() => register()}
              >
                {buttonState.text}
              </Button>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <Checkbox
                  className="seller-terms-checkbox"
                  id="agree-terms-checkbox"
                  checked={agreedToTerms || buttonState.disabled}
                  disabled={buttonState.disabled}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={{ marginTop: "2px", flexShrink: 0 }}
                />
                <Text
                  style={{
                    display: "block",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "12px",
                    cursor: buttonState.disabled ? "default" : "pointer",
                    userSelect: "none",
                  }}
                  onClick={() =>
                    !buttonState.disabled && setAgreedToTerms((prev) => !prev)
                  }
                >
                  By applying, you agree to our{" "}
                  <a
                      href={ENV.SELLER_TERMS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-white/40 hover:text-[#FED469] underline transition-colors duration-300 text-[12px]"
                  >
                    Seller Terms & Conditions
                  </a>
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .benefit-card:hover {
          background: rgba(255,255,255,0.06) !important;
          transform: translateY(-2px);
          border-color: rgba(254, 212, 105, 0.2) !important;
        }

        .seller-terms-checkbox .ant-checkbox-inner {
          background-color: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .seller-terms-checkbox:hover .ant-checkbox-inner,
        .seller-terms-checkbox .ant-checkbox-input:focus + .ant-checkbox-inner {
          border-color: #FED469 !important;
        }
        .seller-terms-checkbox .ant-checkbox-checked .ant-checkbox-inner {
          background-color: #FED469 !important;
          border-color: #FED469 !important;
        }
        .seller-terms-checkbox .ant-checkbox-checked .ant-checkbox-inner::after {
          border-color: #191B24 !important;
        }
      `,
        }}
      />
    </div>
  );
};

export default SellerRegPage;

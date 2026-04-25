import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, Empty, Image, Modal, Spin, Typography } from "antd";
import { useEffect, useState } from "react";
import kycApi from "../../api/kycApi";
import { KycResponse } from "../../api/types";
import { getImageUrl } from "../../utils/imageUtils";

const { Text, Title } = Typography;

interface KycInfoModalProps {
  visible: boolean;
  onCancel: () => void;
  userId?: number;
}

const KycInfoModal = ({ visible, onCancel, userId }: KycInfoModalProps) => {
  const [loading, setLoading] = useState(false);
  const [kycInfo, setKycInfo] = useState<KycResponse | null>(null);
  const [showImages, setShowImages] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchKycInfo();
    } else {
      setShowImages(false);
    }
  }, [visible]);

  const fetchKycInfo = async () => {
    setLoading(true);
    try {
      const data = userId
        ? await kycApi.getKycInfoByUserId(userId)
        : await kycApi.getMyKycInfo();
      setKycInfo(data);
    } catch (error) {
      console.error("Failed to fetch KYC info:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (label: string, value: string | undefined) => (
    <div className="mb-4">
      <div
        style={{ color: "var(--color-text-muted)" }}
        className="text-[11px] mb-1 uppercase tracking-wider font-semibold"
      >
        {label}
      </div>
      <div
        style={{ color: "var(--color-text-primary)" }}
        className="text-[15px] font-medium"
      >
        {value || "N/A"}
      </div>
    </div>
  );

  return (
    <Modal
      title={
        <Title
          level={4}
          style={{ margin: 0, color: "var(--color-text-primary)" }}
        >
          Identity Information
        </Title>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel} type="primary">
          Close
        </Button>,
      ]}
      width={600}
      centered
      styles={{
        mask: {
          backdropFilter: "blur(8px)",
          background: "rgba(0, 0, 0, 0.6)",
        },
        body: {
          padding: "24px",
          background: "var(--color-card-high)",
          borderRadius: "0 0 var(--radius-md) var(--radius-md)",
        },
        header: {
          background: "var(--color-card-high)",
          borderBottom: "1px solid var(--color-border-md)",
          padding: "16px 24px",
          borderRadius: "var(--radius-md) var(--radius-md) 0 0",
        },
      }}
    >
      <Spin spinning={loading}>
        {!loading && kycInfo ? (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-2 gap-x-8">
              {renderField("Full Name", kycInfo.name)}
              {renderField("ID Number", kycInfo.cccdNumber)}
              {renderField("Date of Birth", kycInfo.dob)}
              {renderField("Gender", kycInfo.sex)}
              {renderField("Date of Expiry", kycInfo.doe)}
              {renderField(
                "Created At",
                kycInfo.createdAt
                  ? new Date(kycInfo.createdAt).toLocaleDateString()
                  : "N/A",
              )}
            </div>

            <div className="mt-2">
              {renderField("Address", kycInfo.address)}
            </div>

            <div
              className="mt-6 pt-6"
              style={{ borderTop: "1px solid var(--color-border-md)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <Text
                  style={{
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    fontSize: "11px",
                    letterSpacing: "0.05em",
                    fontWeight: 600,
                  }}
                >
                  Verification Documents
                </Text>
                <Button
                  type="text"
                  size="small"
                  icon={showImages ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={() => setShowImages(!showImages)}
                  style={{ color: "var(--color-gold-start)" }}
                  className="hover:opacity-80 transition-opacity"
                >
                  {showImages ? "Hide Images" : "Show Images"}
                </Button>
              </div>

              {showImages && (
                <div className="grid grid-cols-3 gap-4 animate-fadeIn">
                  {[
                    {
                      url: getImageUrl(kycInfo.frontImageUrl),
                      label: "Front Side",
                    },
                    {
                      url: getImageUrl(kycInfo.backImageUrl),
                      label: "Back Side",
                    },
                    {
                      url: getImageUrl(kycInfo.faceMatchUrl),
                      label: "Face Match",
                      aspect: "square",
                    },
                  ].map((img, idx) => (
                    <div key={idx} className="space-y-2">
                      <Text
                        style={{
                          color: "var(--color-text-muted)",
                          fontSize: "10px",
                          display: "block",
                          textAlign: "center",
                          textTransform: "uppercase",
                        }}
                      >
                        {img.label}
                      </Text>
                      <div
                        className="rounded-lg overflow-hidden"
                        style={{ border: "1px solid var(--color-border-md)" }}
                      >
                        <Image
                          src={img.url}
                          className={`object-cover w-full ${img.aspect === "square" ? "aspect-square" : "aspect-[3/2]"}`}
                          fallback="https://placehold.co/300x200?text=No+Image"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          !loading && (
            <Empty
              description={
                <Text style={{ color: "var(--color-text-muted)" }}>
                  No identity information found
                </Text>
              }
            />
          )
        )}
      </Spin>
    </Modal>
  );
};

export default KycInfoModal;

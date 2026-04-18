import {
  CameraOutlined,
  CheckCircleFilled,
  DeleteOutlined,
  EyeOutlined,
  IdcardOutlined,
  InfoCircleOutlined,
  RetweetOutlined,
  SafetyCertificateOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  ConfigProvider,
  Image,
  message,
  Result,
  Space,
  Spin,
  Steps,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import kycApi from "../../api/kycApi";
import userApi from "../../api/userApi";
import KycInfoModal from "../../features/ekyc/KycInfoModal";
import { useAuthStore } from "../../store/useAuthStore";

const { Title, Text } = Typography;
const { Dragger } = Upload;

const IdentityVerificationPage = () => {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const navigate = useNavigate();

  // States for ID Card Upload
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>("");
  const [backPreview, setBackPreview] = useState<string>("");

  // States for Webcam
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Determine current step
  useEffect(() => {
    if (user?.isVerifiedIdentity && user?.isFaceMatch) {
      setCurrentStep(2);
    } else if (user?.isVerifiedIdentity) {
      setCurrentStep(1);
    } else {
      setCurrentStep(0);
    }
  }, [user]);

  // Handle interruption prevention
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (loading) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [loading]);

  // Clean up Object URLs independently to prevent one from revoking the other
  useEffect(() => {
    return () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
    };
  }, [frontPreview]);

  useEffect(() => {
    return () => {
      if (backPreview) URL.revokeObjectURL(backPreview);
    };
  }, [backPreview]);

  const refreshUser = async () => {
    try {
      const updatedUser = await userApi.getMe();
      // Map User (from backend) to UserInfo (expected by store)
      setUser({
        ...updatedUser,
        id: String(updatedUser.id),
        roles: (updatedUser.roles as any) || [],
      } as any);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const validateFile = (file: File) => {
    const isAcceptedType = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ].includes(file.type);
    if (!isAcceptedType) {
      message.error(`${file.name} is not a valid image type.`);
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Image must be smaller than 5MB!");
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const handleIdRecognition = async () => {
    if (!frontFile || !backFile) {
      message.warning("Please upload both front and back images.");
      return;
    }

    setLoading(true);
    try {
      const response = await kycApi.recognizeId(frontFile, backFile);
      message.success(response.message || "ID successfully recognized!");
      await refreshUser();
    } catch (error: any) {
      message.error(error.message || "Failed to recognize ID card.");
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (err) {
      console.error("Camera error:", err);
      message.error("Could not access camera. Please check permissions.");
    }
  };

  // Assign stream to video element when it's rendered
  useEffect(() => {
    if (showCamera && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream]);

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setStream(null);
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Determine square size (min of width/height)
      const size = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;

      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(-1, 1);
        // Draw from center square with mirroring
        ctx.drawImage(video, startX, startY, size, size, -size, 0, size, size);
        canvas.toBlob(
          async (blob) => {
            if (blob) {
              const file = new File([blob], "selfie.jpg", {
                type: "image/jpeg",
              });
              stopCamera();
              await uploadSelfie(file);
            }
          },
          "image/jpeg",
          0.95,
        );
      }
    }
  };

  const uploadSelfie = async (file: File) => {
    setLoading(true);
    try {
      const response = await kycApi.matchFace(file);
      message.success(response.message || "Face matched successfully!");
      await refreshUser();
    } catch (error: any) {
      message.error(error.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const renderUploadPreview = (
    file: File | null,
    preview: string,
    onRemove: () => void,
    label: string,
  ) => {
    if (file && preview) {
      return (
        <div className="relative group rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] aspect-square flex items-center justify-center">
          <Image
            src={preview}
            alt={label}
            className="object-contain w-full h-full p-2"
            preview={{
              mask: (
                <>
                  <EyeOutlined /> View
                </>
              ),
            }}
          />
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip title="Remove and retry">
              <Button
                shape="circle"
                danger
                icon={<DeleteOutlined />}
                onClick={onRemove}
                size="small"
                className="shadow-lg"
              />
            </Tooltip>
          </div>
        </div>
      );
    }

    return (
      <Dragger
        accept="image/*"
        maxCount={1}
        showUploadList={false}
        className="aspect-square hover:border-[#FED469] transition-all"
        beforeUpload={(file) => {
          if (validateFile(file) !== Upload.LIST_IGNORE) {
            if (label.includes("Front")) {
              setFrontFile(file);
              setFrontPreview(URL.createObjectURL(file));
            } else {
              setBackFile(file);
              setBackPreview(URL.createObjectURL(file));
            }
          }
          return false;
        }}
        style={{
          background: "rgba(255,255,255,0.02)",
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <div className="py-4">
          <p className="mb-3">
            <UploadOutlined style={{ fontSize: "32px", color: "#FED469" }} />
          </p>
          <Text style={{ color: "#fff", display: "block", fontSize: "14px" }}>
            Click or drag {label.toLowerCase()}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>
            Max 5MB (JPEG, PNG, WEBP)
          </Text>
        </div>
      </Dragger>
    );
  };

  const renderStep0 = () => (
    <div className="animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Text
                style={{
                  color: "rgba(255,255,255,0.85)",
                  display: "block",
                  marginBottom: "12px",
                  fontWeight: 600,
                }}
              >
                Front of Identity Card
              </Text>
              {renderUploadPreview(
                frontFile,
                frontPreview,
                () => {
                  setFrontFile(null);
                  URL.revokeObjectURL(frontPreview);
                  setFrontPreview("");
                },
                "Front Image",
              )}
            </div>
            <div>
              <Text
                style={{
                  color: "rgba(255,255,255,0.85)",
                  display: "block",
                  marginBottom: "12px",
                  fontWeight: 600,
                }}
              >
                Back of Identity Card
              </Text>
              {renderUploadPreview(
                backFile,
                backPreview,
                () => {
                  setBackFile(null);
                  URL.revokeObjectURL(backPreview);
                  setBackPreview("");
                },
                "Back Image",
              )}
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            block
            onClick={handleIdRecognition}
            loading={loading}
            disabled={!frontFile || !backFile}
            className="mt-10 h-[52px] shadow-lg glow-gold"
          >
            Update Identification Information
          </Button>
        </div>

        <Card
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
          className="h-fit"
        >
          <Space direction="vertical" size={16}>
            <Title
              level={5}
              style={{
                color: "#FED469",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <InfoCircleOutlined /> Requirements
            </Title>
            <ul className="text-[13px] text-[rgba(255,255,255,0.6)] pl-5 space-y-3">
              <li>Photos must be original (no scans or photocopies).</li>
              <li>All 4 corners of the card must be visible.</li>
              <li>Text must be clear and readable (no glare or blur).</li>
              <li>Check that expiration date is valid.</li>
            </ul>
          </Space>
        </Card>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="max-w-[700px] mx-auto text-center animate-fadeIn">
      {!showCamera ? (
        <Card className="py-6 mb-4">
          <Space direction="vertical" size={24} style={{ width: "100%" }}>
            <div className="w-20 h-20 bg-[rgba(254,212,105,0.1)] rounded-full flex items-center justify-center mx-auto">
              <CameraOutlined style={{ fontSize: "36px", color: "#FED469" }} />
            </div>
            <div>
              <Title level={4} style={{ color: "#fff", marginBottom: "8px" }}>
                Face Verification
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.45)" }}>
                Please position your face in the center of the frame.
              </Text>
            </div>

            <Button
              type="primary"
              size="large"
              onClick={startCamera}
              className="h-[48px] px-10"
            >
              Start Verification
            </Button>

            <div className="mt-6">
              <Text
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "13px",
                  display: "block",
                }}
              >
                Issue with camera? Upload a selfie instead.
              </Text>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => {
                  if (validateFile(file) !== Upload.LIST_IGNORE)
                    uploadSelfie(file);
                  return false;
                }}
              >
                <Button type="text" icon={<UploadOutlined />}>
                  Upload from Device
                </Button>
              </Upload>
            </div>
          </Space>
        </Card>
      ) : (
        <div className="relative mb-10 aspect-square max-w-[500px] mx-auto rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.1)]">
          {/* Face Overlay Frame */}
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
            <div className="w-[75%] h-[80%] rounded-[50%/50%] border-2 border-dashed border-[#FED469] opacity-60 shadow-[0_0_0_1000px_rgba(0,0,0,0.6)]"></div>
          </div>

          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              background: "#000",
              transform: "scaleX(-1)",
              display: "block",
            }}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center gap-6">
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<CameraOutlined />}
              onClick={capturePhoto}
              style={{ width: "56px", height: "56px", fontSize: "20px" }}
              className="animate-pulse"
            />
            <Button
              shape="circle"
              size="large"
              icon={<RetweetOutlined />}
              onClick={stopCamera}
              style={{
                width: "56px",
                height: "56px",
                fontSize: "20px",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(10px)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="animate-fadeIn max-w-[700px] mx-auto">
      <Card className="mb-4">
        <Result
          status="success"
          title={
            <span className="gradient-text-gold text-2xl font-extrabold block mb-2">
              Verification Complete
            </span>
          }
          subTitle={
            <div className="max-w-[480px] mx-auto">
              <Text
                style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}
              >
                Great news! Your identity has been successfully verified.
                <br />
                You can now start applying as Seller.
              </Text>
            </div>
          }
          icon={
            <SafetyCertificateOutlined
              style={{ color: "#FED469", fontSize: "56px" }}
            />
          }
          extra={[
            <Space key="actions" size="middle" className="mt-4">
              <Button
                type="primary"
                onClick={() => navigate("/account/seller-reg")}
                className="px-6 h-[44px]"
              >
                Apply as Seller
              </Button>
              <Button
                className="px-6 h-[44px]"
                onClick={() => setIsKycModalOpen(true)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                View KYC Info
              </Button>
            </Space>,
          ]}
        />
      </Card>
    </div>
  );

  return (
    <div className="account-page-container">
      <Title
        level={2}
        style={{ color: "#fff", marginBottom: "24px", fontSize: "24px" }}
      >
        Identity Verification
      </Title>

      <ConfigProvider
        theme={{
          token: {
            lineWidth: 1,
          },
        }}
      >
        <Steps
          current={currentStep}
          style={{ marginBottom: "24px" }}
          responsive={false}
          labelPlacement="vertical"
          size="small"
          items={[
            { title: "ID Recognition", icon: <IdcardOutlined /> },
            { title: "Face Matching", icon: <CameraOutlined /> },
            { title: "Complete", icon: <CheckCircleFilled /> },
          ]}
        />
      </ConfigProvider>

      <div className="mt-8">
        {currentStep === 0 && renderStep0()}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
      </div>

      {loading && (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#0F111A]/80 backdrop-blur-xl">
          <Spin size="large" className="mb-8" />
          <Title level={4} style={{ color: "#fff", margin: 0 }}>
            Securely Verifying Data...
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.45)", marginTop: "12px" }}>
            This process may take a few moments. Please do not leave this page.
          </Text>
        </div>
      )}

      {/* KYC Information Modal */}
      <KycInfoModal
        visible={isKycModalOpen}
        onCancel={() => setIsKycModalOpen(false)}
      />
    </div>
  );
};

export default IdentityVerificationPage;

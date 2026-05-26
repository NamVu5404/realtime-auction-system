import {
  DownloadOutlined,
  CopyOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Input,
  Modal,
  QRCode,
  Space,
  message,
  Tooltip,
  Spin,
} from "antd";
import logoUrl from "../../assets/images/logo.webp";
import { auctionApi } from "../../api/auctionApi";
import { Auction } from "../../api/types";

interface ShareAuctionModalProps {
  visible: boolean;
  auction: Auction | null;
  onCancel: () => void;
}

export const ShareAuctionModal = ({
  visible,
  auction,
  onCancel,
}: ShareAuctionModalProps) => {
  const { data: token, isLoading } = useQuery({
    queryKey: ["auction-token", auction?.id],
    queryFn: () => auctionApi.getAuctionToken(auction!.id),
    enabled: !!auction && visible && !!auction.privateMode,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (!auction) return null;

  const shareUrl = `${window.location.origin}/auction/${auction.id}${
    token ? `?token=${token}` : ""
  }`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    message.success("Link copied to clipboard!");
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[đĐ]/g, "d")
      .replace(/([^a-z0-9\s-]|(?<=\s)\s+)/g, "")
      .trim()
      .replace(/\s+/g, "-");
  };

  const downloadQRCode = () => {
    const canvas = document
      .getElementById("auction-qrcode")
      ?.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      const fileName = `QR-${slugify(auction.title)}.png`;
      a.download = fileName;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      message.error("Failed to download QR Code");
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ShareAltOutlined className="text-[#FED469]" />
          <span>Share Auction</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          Close
        </Button>,
      ]}
      width={400}
      centered
      className="share-auction-modal"
    >
      <div className="flex flex-col items-center gap-6 py-4">
        {isLoading ? (
          <div className="h-[232px] flex items-center justify-center">
            <Spin size="large" tip="Generating QR Code..." />
          </div>
        ) : (
          <>
            {/* QR Code Section */}
            <div
              className="bg-white p-4 rounded-xl shadow-lg border border-zinc-200"
              id="auction-qrcode"
            >
              <QRCode
                value={shareUrl}
                size={200}
                bordered={false}
                errorLevel="H"
                color="#000000"
                bgColor="#FFFFFF"
                icon={logoUrl}
              />
            </div>

            <div className="w-full space-y-4">
              <p className="text-zinc-400 text-xs text-center uppercase tracking-widest font-bold">
                Scan to Join Auction
              </p>

              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="bg-zinc-900 border-zinc-800 text-zinc-300"
                />
                <Tooltip title="Copy Link">
                  <Button
                    icon={<CopyOutlined />}
                    onClick={handleCopyLink}
                    className="flex-shrink-0"
                  />
                </Tooltip>
              </div>

              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={downloadQRCode}
                block
                className="h-10 font-bold"
              >
                Download QR Code Image
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ShareAuctionModal;

import { Modal, Form, Input, Button, message } from "antd";
import { useState } from "react";
import adminApi from "../../api/adminApi";

interface CancelAuctionModalProps {
  visible: boolean;
  auctionId?: number;
  auctionTitle?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

/**
 * CancelAuctionModal Component
 *
 * Features:
 * - Opens when user clicks "Cancel" on a DRAFT or SCHEDULED auction
 * - Requires a reason (minimum 10 characters)
 * - Sends auctionId + reason to backend
 * - Confirmation button only enabled when reason is valid
 */
export const CancelAuctionModal = ({
  visible,
  auctionId,
  auctionTitle,
  onCancel,
  onSuccess,
}: CancelAuctionModalProps) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [reasonLength, setReasonLength] = useState(0);

  const MIN_REASON_LENGTH = 3;
  const isReasonValid = reasonLength >= MIN_REASON_LENGTH;

  const handleOk = async () => {
    try {
      await form.validateFields();
      setIsLoading(true);

      if (auctionId) {
        const reason = form.getFieldValue("reason")?.trim();

        if (!reason || reason.length < MIN_REASON_LENGTH) {
          message.error(
            `Reason must be at least ${MIN_REASON_LENGTH} characters`,
          );
          return;
        }

        // Call cancel API with reason
        await adminApi.cancelAuction(auctionId, { reason });

        message.success("Auction cancelled successfully");
        form.resetFields();
        setReasonLength(0);
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to cancel auction:", error);
      message.error("Failed to cancel auction");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setReasonLength(0);
    onCancel();
  };

  return (
    <Modal
      title={`Cancel Auction: "${auctionTitle}"`}
      open={visible}
      onCancel={handleCancel}
      centered
      width={500}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Close
        </Button>,
        <Button
          key="confirm"
          type="primary"
          danger
          onClick={handleOk}
          loading={isLoading}
          disabled={!isReasonValid}
        >
          Confirm Cancellation
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="reason"
          label="Cancellation Reason"
          rules={[
            {
              required: true,
              message: "Please provide a reason for cancellation",
            },
            {
              min: MIN_REASON_LENGTH,
              message: `Reason must be at least ${MIN_REASON_LENGTH} characters`,
            },
          ]}
          help={`${reasonLength} / ${MIN_REASON_LENGTH} characters (minimum required)`}
        >
          <Input.TextArea
            rows={4}
            placeholder={`Enter reason for cancellation (minimum ${MIN_REASON_LENGTH} characters)...`}
            onChange={(e) => setReasonLength(e.target.value.trim().length)}
            status={reasonLength > 0 && !isReasonValid ? "error" : ""}
          />
        </Form.Item>

        <div className="mt-4 p-3 bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded text-sm text-yellow-300">
          <strong>Note:</strong> This action cannot be undone!
        </div>
      </Form>
    </Modal>
  );
};

export default CancelAuctionModal;

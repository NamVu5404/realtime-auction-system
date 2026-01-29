import {
  Button,
  DatePicker,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Modal,
  Space,
  Upload,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { Auction, AuctionStatus } from "../../api/types";
import adminApi from "../../api/adminApi";
import { convertUTCToLocal } from "../../utils/dateUtils";

interface AuctionFormProps {
  form: FormInstance;
  auction?: Auction;
  onSuccess?: () => void;
  onCancel?: () => void;
  mode: "create" | "edit";
}

/**
 * AuctionForm Component
 *
 * Modes:
 * 1. CREATE mode:
 *    - Save Draft: Only requires title (status=DRAFT)
 *    - Schedule: Full validation required (status=SCHEDULED)
 *
 * 2. EDIT mode (status-dependent):
 *    - DRAFT: All fields editable, options to "Update Draft" or "Schedule"
 *    - SCHEDULED: Lock startPrice & minStep, allow editing title, description, image, times
 *
 * Time Validation: startTime must be at least 1 minute after current local system time
 */
export const AuctionForm = ({
  form,
  auction,
  onSuccess,
  onCancel,
  mode,
}: AuctionFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [submitMode, setSubmitMode] = useState<"draft" | "schedule">("draft");
  const [isFormChanged, setIsFormChanged] = useState(false);

  // Helper function to check if data has changed
  const hasDataChanged = (values: any): boolean => {
    if (!auction) return true; // New auction, always has changes

    // Compare basic fields
    if (values.title !== auction.title) return true;
    if ((values.description || "") !== (auction.description || "")) return true;

    // Compare image
    // Check if new image uploaded
    if (values.image?.[0]?.originFileObj) return true;
    // Check if image was removed (auction has image but form doesn't)
    if (auction.image && (!values.image || values.image.length === 0))
      return true;
    // Check if image was removed (form has no URL matching auction's image)
    if (auction.image && values.image?.[0]?.url !== auction.image) return true;

    // Compare price fields
    if (values.startPrice !== auction.startPrice) return true;
    if (values.minStep !== auction.minStep) return true;

    // Compare times using Unix timestamps (milliseconds) to avoid ISO string precision issues
    // Form values are dayjs objects (in local timezone from convertUTCToLocal)
    // Auction values are UTC ISO strings that need to be parsed as UTC
    const formStartTimeMs = values.startTime?.valueOf() ?? null; // dayjs to timestamp
    const formEndTimeMs = values.endTime?.valueOf() ?? null;
    const auctionStartTimeMs = auction.startTime
      ? dayjs.utc(auction.startTime).valueOf()
      : null;
    const auctionEndTimeMs = auction.endTime
      ? dayjs.utc(auction.endTime).valueOf()
      : null;

    if (formStartTimeMs !== auctionStartTimeMs) return true;
    if (formEndTimeMs !== auctionEndTimeMs) return true;

    return false;
  };

  // Initialize form with auction data if in edit mode
  useEffect(() => {
    if (mode === "edit" && auction) {
      const startTimeLocal = auction.startTime
        ? convertUTCToLocal(auction.startTime)
        : null;
      const endTimeLocal = auction.endTime
        ? convertUTCToLocal(auction.endTime)
        : null;

      form.setFieldsValue({
        title: auction.title,
        description: auction.description,
        image: auction.image ? [{ url: auction.image }] : undefined,
        startPrice: auction.startPrice,
        minStep: auction.minStep,
        startTime: startTimeLocal,
        endTime: endTimeLocal,
      });

      // Reset form changed state after initialization
      setIsFormChanged(false);
    }
  }, [mode, auction, form]);

  // Track form changes
  useEffect(() => {
    if (mode === "edit" && auction) {
      const checkChanges = () => {
        const values = form.getFieldsValue();
        setIsFormChanged(hasDataChanged(values));
      };

      // Check changes on form value change
      const interval = setInterval(checkChanges, 300);
      return () => clearInterval(interval);
    }
  }, [mode, auction, form]);

  // Validator: startTime must be at least 1 minute from now
  const validateStartTime = (_: any, value: any) => {
    if (!value) return Promise.resolve();

    const now = dayjs();
    const minAllowedTime = now.add(1, "minute");

    if (value.isBefore(minAllowedTime)) {
      return Promise.reject(
        new Error("Start time must be at least 1 minute from now"),
      );
    }

    return Promise.resolve();
  };

  // Validator: endTime must be after startTime
  const validateEndTime = (_: any, value: any) => {
    if (!value) return Promise.resolve();

    const startTime = form.getFieldValue("startTime");
    if (!startTime) {
      return Promise.reject(new Error("Set start time first"));
    }

    if (!value.isAfter(startTime)) {
      return Promise.reject(new Error("End time must be after start time"));
    }

    return Promise.resolve();
  };

  const handleSubmit = async (values: any) => {
    try {
      setIsLoading(true);

      if (mode === "create") {
        // CREATE mode
        if (submitMode === "draft") {
          // Save Draft - only title required
          const draftData = new FormData();
          draftData.append("title", values.title);
          if (values.description)
            draftData.append("description", values.description);
          if (values.image?.[0]?.originFileObj) {
            draftData.append("image", values.image[0].originFileObj);
          }

          // Call draft endpoint with Draft validation group
          await adminApi.saveDraft(draftData);
          message.success("Auction saved as draft");
        } else {
          // Schedule - full validation required
          const scheduleData = new FormData();
          scheduleData.append("title", values.title);
          scheduleData.append("description", values.description || "");
          if (values.image?.[0]?.originFileObj) {
            scheduleData.append("image", values.image[0].originFileObj);
          }
          scheduleData.append("startPrice", values.startPrice);
          scheduleData.append("minStep", values.minStep);
          scheduleData.append("startTime", values.startTime.toISOString());
          scheduleData.append("endTime", values.endTime.toISOString());

          await adminApi.scheduleAuction(scheduleData);
          message.success("Auction scheduled successfully");
        }
      } else if (mode === "edit" && auction) {
        // UPDATE mode
        if (auction.status === AuctionStatus.DRAFT) {
          // DRAFT: All fields editable, options to "Update Draft" or "Schedule"
          const updateData = {
            title: values.title,
            description: values.description || "",
            image: values.image?.[0]?.originFileObj,
            startPrice: values.startPrice,
            minStep: values.minStep,
            startTime: values.startTime?.toISOString(),
            endTime: values.endTime?.toISOString(),
          };

          if (submitMode === "schedule") {
            // Schedule: Convert DRAFT to SCHEDULED
            // Backend expects full validation for schedule
            const scheduleData = new FormData();
            scheduleData.append("id", auction.id.toString()); // Hidden id to update existing draft
            scheduleData.append("title", updateData.title);
            scheduleData.append("description", updateData.description);
            if (updateData.image) {
              scheduleData.append("image", updateData.image);
            }
            scheduleData.append("startPrice", updateData.startPrice);
            scheduleData.append("minStep", updateData.minStep);
            scheduleData.append("startTime", updateData.startTime!);
            scheduleData.append("endTime", updateData.endTime!);

            // Call POST scheduleAuction with id to convert draft to scheduled
            await adminApi.scheduleAuction(scheduleData);
            message.success("Auction scheduled successfully");
          } else {
            // Update Draft - only call API if data has changed
            if (hasDataChanged(values)) {
              await adminApi.updateDraftAuction(auction.id, updateData as any);
              message.success("Draft updated successfully");
            } else {
              message.info("No changes to save");
            }
          }
        } else if (auction.status === AuctionStatus.SCHEDULED) {
          // SCHEDULED: Lock startPrice & minStep, allow editing title, description, image, times
          const updateData = {
            title: values.title,
            description: values.description || "",
            image: values.image?.[0]?.originFileObj,
            startTime: values.startTime?.toISOString(),
            endTime: values.endTime?.toISOString(),
          };

          // Only call API if data has changed
          if (hasDataChanged(values)) {
            await adminApi.updateScheduledAuction(
              auction.id,
              updateData as any,
            );
            message.success("Auction updated successfully");
          } else {
            message.info("No changes to save");
          }
        }
      }

      onSuccess?.();
    } catch (error) {
      console.error("Failed to submit auction:", error);
      message.error("Failed to submit auction");
    } finally {
      setIsLoading(false);
    }
  };

  const isScheduledStatus = auction?.status === AuctionStatus.SCHEDULED;
  const isDraftStatus = auction?.status === AuctionStatus.DRAFT;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      autoComplete="off"
    >
      {/* Title - Always required */}
      <Form.Item
        name="title"
        label="Title"
        rules={[{ required: true, message: "Title is required" }]}
      >
        <Input
          placeholder="Enter auction title"
          disabled={isScheduledStatus && mode === "edit"}
        />
      </Form.Item>

      {/* Description - Required for Schedule, Optional for Draft */}
      <Form.Item
        name="description"
        label="Description"
        // rules={[
        //   {
        //     required: submitMode === 'schedule',
        //     message: 'Description is required for scheduled auctions',
        //   },
        // ]}
      >
        <Input.TextArea
          rows={4}
          placeholder="Enter auction description"
          disabled={isScheduledStatus && mode === "edit"}
        />
      </Form.Item>

      {/* Image - Required for Schedule, Optional for Draft */}
      <Form.Item
        name="image"
        label="Image"
        // rules={[
        //   {
        //     required: submitMode === "schedule",
        //     message: "Image is required for scheduled auctions",
        //   },
        // ]}
      >
        <Upload
          listType="picture-card"
          maxCount={1}
          accept="image/*"
          beforeUpload={() => false}
        >
          <div>
            <UploadOutlined />
            <div className="mt-2">Upload</div>
          </div>
        </Upload>
      </Form.Item>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Price - Required for Schedule, Optional for Draft, Read-only for SCHEDULED */}
        <Form.Item
          name="startPrice"
          label="Start Price"
          rules={[
            {
              required: submitMode === "schedule",
              message: "Start price is required for scheduled auctions",
            },
            {
              pattern: /^\d+(\.\d{1,2})?$/,
              message: "Enter a valid price",
            },
          ]}
        >
          <InputNumber
            placeholder="0.00"
            min={0.01}
            step={0.01}
            precision={2}
            disabled={isScheduledStatus}
            className="w-full"
          />
        </Form.Item>

        {/* Minimum Step - Required for Schedule, Optional for Draft, Read-only for SCHEDULED */}
        <Form.Item
          name="minStep"
          label="Minimum Step (Bid Increment)"
          rules={[
            {
              required: submitMode === "schedule",
              message: "Minimum step is required for scheduled auctions",
            },
            {
              pattern: /^\d+(\.\d{1,2})?$/,
              message: "Enter a valid step amount",
            },
          ]}
        >
          <InputNumber
            placeholder="0.00"
            min={0.01}
            step={0.01}
            precision={2}
            disabled={isScheduledStatus}
            className="w-full"
          />
        </Form.Item>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Time - Required for Schedule, Optional for Draft */}
        <Form.Item
          name="startTime"
          label="Start Time"
          rules={[
            ...(submitMode === "schedule"
              ? [
                  {
                    required: true,
                    message: "Start time is required for scheduled auctions",
                  },
                ]
              : []),
            {
              validator: (_, value) => {
                // For draft: only validate if value is provided
                if (submitMode === "draft" && !value) {
                  return Promise.resolve();
                }
                // For schedule or when value exists: perform validation
                return validateStartTime(_, value);
              },
            },
          ]}
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            className="w-full"
            allowClear
            placeholder="Select start time"
          />
        </Form.Item>

        {/* End Time - Required for Schedule, Optional for Draft */}
        <Form.Item
          name="endTime"
          label="End Time"
          rules={[
            ...(submitMode === "schedule"
              ? [
                  {
                    required: true,
                    message: "End time is required for scheduled auctions",
                  },
                ]
              : []),
            {
              validator: (_, value) => {
                // For draft: only validate if value is provided
                if (submitMode === "draft" && !value) {
                  return Promise.resolve();
                }
                // For schedule or when value exists: perform validation
                return validateEndTime(_, value);
              },
            },
          ]}
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            className="w-full"
            allowClear
            placeholder="Select end time"
          />
        </Form.Item>
      </div>

      {/* Action Buttons */}
      <Form.Item>
        <Space>
          {mode === "create" ? (
            <>
              {/* CREATE mode: Save Draft vs Schedule */}
              <Button
                onClick={() => {
                  setSubmitMode("draft");
                  form.submit();
                }}
                loading={isLoading}
              >
                Save as Draft
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setSubmitMode("schedule");
                  form.submit();
                }}
                loading={isLoading}
              >
                Schedule
              </Button>
            </>
          ) : isDraftStatus ? (
            <>
              {/* EDIT DRAFT mode: Update Draft vs Publish */}
              <Button
                onClick={() => {
                  setSubmitMode("draft");
                  form.submit();
                }}
                loading={isLoading}
                disabled={!isFormChanged}
              >
                Update Draft
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setSubmitMode("schedule");
                  form.submit();
                }}
                loading={isLoading}
              >
                Schedule
              </Button>
            </>
          ) : (
            <>
              {/* EDIT SCHEDULED mode: Update only */}
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                disabled={!isFormChanged}
              >
                Update
              </Button>
            </>
          )}
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default AuctionForm;

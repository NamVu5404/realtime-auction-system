import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DatePicker,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Space,
  Switch,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import adminApi from "../../api/adminApi";
import { Auction, AuctionStatus } from "../../api/types";
import { AuctionImageManager } from "../../components/admin/AuctionImageManager";
import { TiptapEditor } from "../../components/common/TiptapEditor";
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
  const [localAuction, setLocalAuction] = useState<Auction | null>(null);
  const queryClient = useQueryClient();

  // Helper function to check if data has changed
  const hasDataChanged = (values: any): boolean => {
    if (!auction) return true; // New auction, always has changes

    // Compare basic fields
    if (values.title !== auction.title) return true;
    if ((values.description || "") !== (auction.description || "")) return true;

    // In EDIT mode, image is managed separately via AuctionImageManager
    if (mode === "create") {
      // Check if new image uploaded
      if (values.image?.[0]?.originFileObj) return true;
      // Check if image was removed (auction has image but form doesn't)
      if (auction.image && (!values.image || values.image.length === 0))
        return true;
      // Check if image was removed (form has no URL matching auction's image)
      if (auction.image && values.image?.[0]?.url !== auction.image)
        return true;
    }

    // Compare price fields
    if (values.startPrice !== auction.startPrice) return true;
    if (values.minStep !== auction.minStep) return true;
    if (values.reservePrice !== auction.reservePrice) return true;
    if (!!values.privateMode !== !!auction.privateMode) return true;
    if (values.antiSnipeSeconds !== auction.antiSnipeSeconds) return true;
    if (values.extensionSeconds !== auction.extensionSeconds) return true;

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

  // Sync localAuction with prop
  useEffect(() => {
    if (auction) {
      setLocalAuction(auction);
    }
  }, [auction]);

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
        reservePrice: auction.reservePrice,
        startTime: startTimeLocal,
        endTime: endTimeLocal,
        privateMode: auction.privateMode ?? false,
        antiSnipeSeconds: auction.antiSnipeSeconds ?? 0,
        extensionSeconds: auction.extensionSeconds ?? 0,
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
        if (!localAuction) {
          // Initial creation (Draft or Schedule)
          const requestData = {
            title: values.title,
            description: values.description || "",
            startPrice: values.startPrice,
            minStep: values.minStep,
            reservePrice: values.reservePrice,
            privateMode: !!values.privateMode,
            antiSnipeSeconds: values.antiSnipeSeconds ?? 0,
            extensionSeconds: values.extensionSeconds ?? 0,
            startTime: values.startTime?.toISOString(),
            endTime: values.endTime?.toISOString(),
          };

          if (submitMode === "draft") {
            const draftResult = await adminApi.saveDraft(requestData);
            setLocalAuction(draftResult);
            setIsFormChanged(false);
            message.success("Auction saved as draft");
            setIsLoading(false);
            return; // Stay in modal to allow image/further edits
          } else {
            const scheduleResult = await adminApi.scheduleAuction(requestData);
            setLocalAuction(scheduleResult.result);
            setIsFormChanged(false);
            message.success(scheduleResult.message);
          }
        } else {
          // We have a localAuction, so treat it as an update
          const updateData = {
            title: values.title,
            description: values.description || "",
            startPrice: values.startPrice,
            minStep: values.minStep,
            reservePrice: values.reservePrice,
            privateMode: !!values.privateMode,
            antiSnipeSeconds: values.antiSnipeSeconds ?? 0,
            extensionSeconds: values.extensionSeconds ?? 0,
            startTime: values.startTime?.toISOString(),
            endTime: values.endTime?.toISOString(),
          };

          if (submitMode === "schedule") {
            const res = await adminApi.scheduleAuction({
              ...updateData,
              id: localAuction.id,
            });
            message.success(res.message);
          } else {
            if (localAuction.status === AuctionStatus.DRAFT) {
              const res = await adminApi.updateDraftAuction(
                localAuction.id,
                updateData,
              );
              message.success(res.message);
            } else {
              const res = await adminApi.updateScheduledAuction(
                localAuction.id,
                updateData,
              );
              message.success(res.message);
            }
          }
        }
      } else if (mode === "edit" && auction) {
        // UPDATE mode
        if (auction.status === AuctionStatus.DRAFT) {
          // DRAFT: All fields editable, options to "Update Draft" or "Schedule"
          const updateData = {
            title: values.title,
            description: values.description || "",
            // image is managed separately via AuctionImageManager
            startPrice: values.startPrice,
            minStep: values.minStep,
            reservePrice: values.reservePrice,
            privateMode: !!values.privateMode,
            antiSnipeSeconds: values.antiSnipeSeconds ?? 0,
            extensionSeconds: values.extensionSeconds ?? 0,
            startTime: values.startTime?.toISOString(),
            endTime: values.endTime?.toISOString(),
          };

          if (submitMode === "schedule") {
            // Schedule: Convert DRAFT to SCHEDULED
            const scheduleData = new FormData();
            scheduleData.append("id", auction.id.toString());
            scheduleData.append("title", updateData.title);
            scheduleData.append("description", updateData.description);
            // scheduleData.append("image", ...) is NOT needed as images are auto-uploaded
            scheduleData.append("startPrice", updateData.startPrice.toString());
            scheduleData.append("minStep", updateData.minStep.toString());
            if (
              updateData.reservePrice !== undefined &&
              updateData.reservePrice !== null
            ) {
              scheduleData.append(
                "reservePrice",
                updateData.reservePrice.toString(),
              );
            }
            scheduleData.append(
              "privateMode",
              updateData.privateMode.toString(),
            );
            if (updateData.antiSnipeSeconds !== undefined) {
              scheduleData.append(
                "antiSnipeSeconds",
                updateData.antiSnipeSeconds.toString(),
              );
            }
            if (updateData.extensionSeconds !== undefined) {
              scheduleData.append(
                "extensionSeconds",
                updateData.extensionSeconds.toString(),
              );
            }
            scheduleData.append("startTime", updateData.startTime!);
            scheduleData.append("endTime", updateData.endTime!);

            const res = await adminApi.scheduleAuction(scheduleData);
            message.success(res.message);
          } else {
            // Update Draft
            if (hasDataChanged(values)) {
              const res = await adminApi.updateDraftAuction(
                auction.id,
                updateData as any,
              );
              message.success(res.message);
            } else {
              message.info("No changes to save");
            }
          }
        } else if (auction.status === AuctionStatus.SCHEDULED) {
          // SCHEDULED: Locked fields, text fields and times editable
          const updateData = {
            title: values.title,
            description: values.description || "",
            reservePrice: values.reservePrice,
            privateMode: !!values.privateMode,
            antiSnipeSeconds: values.antiSnipeSeconds ?? 0,
            extensionSeconds: values.extensionSeconds ?? 0,
            startTime: values.startTime?.toISOString(),
            endTime: values.endTime?.toISOString(),
          };

          if (hasDataChanged(values)) {
            const res = await adminApi.updateScheduledAuction(
              auction.id,
              updateData as any,
            );
            message.success(res.message);
          } else {
            message.info("No changes to save");
          }
        }
      }

      onSuccess?.();
    } catch (error: any) {
      console.error("Failed to submit auction:", error);
      message.error(error.message);
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
        <Input placeholder="Enter auction title" disabled={isScheduledStatus} />
      </Form.Item>

      {/* Description */}
      <Form.Item name="description" label="Description">
        <TiptapEditor placeholder="Enter auction description" />
      </Form.Item>

      {/* Image Section */}
      <Form.Item label="Images">
        {(mode === "edit" && localAuction) ||
        (mode === "create" && localAuction) ? (
          <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
            <AuctionImageManager
              key={localAuction!.id}
              auctionId={localAuction!.id}
              status={localAuction!.status}
              initialImages={localAuction!.images || []}
              onImagesChange={(newImages) => {
                // Update local state to prevent flickering
                setLocalAuction((prev) =>
                  prev ? { ...prev, images: newImages } : null,
                );

                // Invalidate all auction lists to reflect new image immediately
                queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
                queryClient.invalidateQueries({
                  queryKey: ["seller-auctions"],
                });
                queryClient.invalidateQueries({ queryKey: ["auctions"] });
              }}
            />
          </div>
        ) : (
          <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 border-dashed text-center">
            <p className="text-gray-400 m-0">
              Save as draft first to enable image management.
            </p>
          </div>
        )}
      </Form.Item>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        {/* Start Price */}
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

        {/* Minimum Step */}
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

        {/* Reserve Price */}
        <Form.Item
          name="reservePrice"
          label="Reserve Price (Optional)"
          tooltip="When the auction ends and the highest bid is less than the reserve price, it will be moved to the ENDED NO SALE status, no one wins and you can relist."
          rules={[
            {
              pattern: /^\d+(\.\d{1,2})?$/,
              message: "Enter a valid price",
            },
          ]}
        >
          <InputNumber
            placeholder="Optional reserve price"
            min={0}
            step={0.01}
            precision={2}
            className="w-full"
          />
        </Form.Item>

        {/* Private Auction */}
        <Form.Item
          name="privateMode"
          label="Private Auction"
          valuePropName="checked"
          tooltip="If enabled, this auction will not be listed publicly and only accessible via a direct link."
        >
          <Switch />
        </Form.Item>

        {/* Anti-Snipe Seconds */}
        <Form.Item
          name="antiSnipeSeconds"
          label="Anti-Snipe (Seconds)"
          tooltip="The window (in seconds) before the auction ends. Any bid placed within this time will trigger an extension."
        >
          <InputNumber defaultValue={0} min={0} max={60} className="w-full" />
        </Form.Item>

        {/* Extension Seconds */}
        <Form.Item
          name="extensionSeconds"
          label="Extension (Seconds)"
          tooltip="The amount of time (in seconds) the auction will be extended by when a bid is placed within the anti-snipe window."
        >
          <InputNumber min={0} max={300} className="w-full" defaultValue={0} />
        </Form.Item>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Time */}
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
                if (submitMode === "draft" && !value) {
                  return Promise.resolve();
                }
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

        {/* End Time */}
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
                if (submitMode === "draft" && !value) {
                  return Promise.resolve();
                }
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
      <Form.Item className="mb-0 mt-2">
        <Space>
          {mode === "create" && !localAuction ? (
            <>
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
          ) : isDraftStatus || localAuction?.status === AuctionStatus.DRAFT ? (
            <>
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
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              disabled={!isFormChanged}
            >
              Update
            </Button>
          )}
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default AuctionForm;

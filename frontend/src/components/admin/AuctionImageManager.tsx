import {
  DeleteOutlined,
  InboxOutlined,
  MenuOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { App, Button, Card, Progress, Upload } from "antd";
import React, { useEffect, useState } from "react";
import { extractErrorMessage } from "../../api/apiUtils";
import { fileApi } from "../../api/fileApi";
import {
  AuctionStatus,
  FileMetadataRequest,
  FileResponse,
} from "../../api/types";
import { getImageUrl } from "../../utils/imageUtils";

interface AuctionImageManagerProps {
  auctionId: number;
  status?: AuctionStatus;
  initialImages?: FileResponse[];
  onImagesChange?: (images: FileResponse[]) => void;
}

interface UploadingFile {
  uid: string;
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
  previewUrl?: string; // Add preview for optimistic UI
}

// Sortable Item Component
interface ManagedImage extends Omit<Partial<FileResponse>, "id"> {
  id: number | string;
  isLocal?: boolean;
  file?: File;
  previewUrl?: string;
  sortOrder: number;
  isPrimary: boolean;
}

interface SortableImageItemProps {
  file: ManagedImage;
  onSetPrimary: (id: number | string) => void;
  onDelete: (id: number | string) => void;
}

const SortableImageItem = ({
  file,
  disabled,
  onSetPrimary,
  onDelete,
}: SortableImageItemProps & { disabled?: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id.toString(), disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square"
    >
      <Card
        className={`w-full h-full overflow-hidden bg-[var(--color-bg)] flex flex-col p-0 ${
          file.isPrimary ? "border-yellow-500/50" : ""
        }`}
        styles={{ body: { padding: 0, height: "100%" } }}
      >
        <div className="relative flex-1 overflow-hidden bg-zinc-950 flex items-center justify-center aspect-square w-full">
          <img
            src={
              file.isLocal || (file as any).isPlaceholder
                ? file.previewUrl
                : getImageUrl(file as FileResponse)
            }
            alt="auction"
            className={`w-full h-full object-cover rounded-lg ${file.isLocal || (file as any).isPlaceholder ? "opacity-40 grayscale" : ""}`}
          />

          {(file as any).isPlaceholder && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Actions overlay - Move drag handle AFTER this to ensure it's on top */}
          {!disabled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type={file.isPrimary ? "primary" : "default"}
                shape="circle"
                icon={file.isPrimary ? <StarFilled /> : <StarOutlined />}
                onClick={() => onSetPrimary(file.id)}
                className={
                  file.isPrimary ? "bg-yellow-500 border-yellow-500" : ""
                }
              />
              <Button
                danger
                shape="circle"
                icon={<DeleteOutlined />}
                onClick={() => onDelete(file.id)}
              />
            </div>
          )}

          {/* Drag Handle - Ensure high z-index and visibility */}
          {!disabled && (
            <div
              {...attributes}
              {...listeners}
              className="absolute top-2 left-2 p-1.5 bg-black/70 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-20"
            >
              <MenuOutlined className="text-white text-sm" />
            </div>
          )}

          {file.isPrimary && (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-bold rounded">
              PRIMARY
            </div>
          )}

          {file.isLocal && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded uppercase">
              New
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export const AuctionImageManager: React.FC<AuctionImageManagerProps> = ({
  auctionId,
  status,
  initialImages = [],
  onImagesChange,
}) => {
  const { message } = App.useApp();
  const [images, setImages] = useState<ManagedImage[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Ref to track latest sort order for concurrent uploads
  const nextSortOrderRef = React.useRef<number>(0);

  const isEditable =
    !status ||
    status === AuctionStatus.DRAFT ||
    status === AuctionStatus.SCHEDULED;

  useEffect(() => {
    // Only Sync from parent if we don't have unsaved local changes
    // This prevents parent re-renders from wiping out newly uploaded images
    if (!isDirty) {
      const validImages = (initialImages || []).filter((img) => !!img);
      const sorted = [...validImages].sort((a, b) => a.sortOrder - b.sortOrder);
      setImages(sorted);
      nextSortOrderRef.current =
        sorted.length > 0
          ? Math.max(...sorted.map((img) => img.sortOrder)) + 1
          : 0;
    }
  }, [initialImages, isDirty]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const validateFile = (file: File) => {
    const isImage = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ].includes(file.type);
    if (!isImage) {
      message.error(
        `${file.name} is not a valid image format (JPG, PNG, WEBP, GIF)`,
      );
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error(`${file.name} must be smaller than 5MB!`);
      return false;
    }
    return true;
  };

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;
    const browserFile = file as File;

    if (!validateFile(browserFile)) {
      onError(new Error("Validation failed"));
      return;
    }

    const uid = (file as any).uid;

    try {
      const nextSortOrder = nextSortOrderRef.current;
      nextSortOrderRef.current += 1;

      const previewUrl = URL.createObjectURL(browserFile);

      setImages((prev) => {
        const newImage: ManagedImage = {
          id: `local-${uid}`,
          file: browserFile,
          previewUrl,
          isLocal: true,
          sortOrder: nextSortOrder,
          isPrimary: prev.length === 0,
        };
        const newImages = [...prev, newImage].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );
        return newImages;
      });

      setIsDirty(true);
      onSuccess(null);
    } catch (error: any) {
      console.error("Upload preparation error:", error);
      message.error(extractErrorMessage(error));
      onError(error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImages((prev) => {
        const oldIndex = prev.findIndex(
          (img) => String(img.id) === String(active.id),
        );
        const newIndex = prev.findIndex(
          (img) => String(img.id) === String(over.id),
        );

        const newImages = arrayMove(prev, oldIndex, newIndex).map(
          (img, index) => ({
            ...img,
            sortOrder: index,
          }),
        );

        setIsDirty(true);
        return newImages;
      });
    }
  };

  const handleSetPrimary = (targetId: number | string) => {
    setImages((prev) => {
      const newImages = prev.map((img) => ({
        ...img,
        isPrimary: String(img.id) === String(targetId),
      }));
      setIsDirty(true);
      return newImages;
    });
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      const updatedImages = [...images];

      // 1. Upload local files
      for (let i = 0; i < updatedImages.length; i++) {
        const item = updatedImages[i];
        if (item.isLocal && item.file) {
          const result = await fileApi.uploadFile(
            item.file,
            auctionId,
            item.isPrimary,
            item.sortOrder,
          );
          updatedImages[i] = { ...result, isPrimary: item.isPrimary }; // Keep current primary status from UI
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        }
      }

      // 2. Update all metadata to ensure sortOrder follows current grid order
      const metaRequests: FileMetadataRequest[] = updatedImages
        .filter((img) => typeof img.id === "number")
        .map((img, index) => ({
          id: img.id as number,
          isPrimary: img.isPrimary,
          sortOrder: index,
        }));

      await fileApi.updateMetadataBatch(metaRequests, auctionId);

      const finalImages = updatedImages.map((img, index) => ({
        ...(img as FileResponse),
        sortOrder: index,
      }));

      setImages(finalImages);
      setIsDirty(false);
      if (onImagesChange) onImagesChange(finalImages);
      message.success("Image settings saved successfully");
    } catch (error) {
      console.error("Batch save error:", error);
      message.error(extractErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (targetId: number | string) => {
    try {
      const imageToDelete = images.find(
        (img) => String(img.id) === String(targetId),
      );
      if (!imageToDelete) return;

      if (!imageToDelete.isLocal) {
        await fileApi.deleteFile(imageToDelete.id as number, auctionId);
      } else if (imageToDelete.previewUrl) {
        URL.revokeObjectURL(imageToDelete.previewUrl);
      }

      const newImages = images.filter(
        (img) => String(img.id) !== String(targetId),
      );
      setImages(newImages);
      setIsDirty(true);
      message.success("Image removed");
    } catch (error) {
      message.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      {isDirty && (
        <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg">
          <span className="text-yellow-500 text-sm font-medium">
            You have unsaved changes in image positions or primary selection.
          </span>
          <Button
            type="primary"
            size="small"
            onClick={handleSaveChanges}
            loading={isSaving}
            className="bg-yellow-500 border-yellow-500 hover:bg-yellow-600"
          >
            Save photo settings
          </Button>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={isEditable ? handleDragEnd : undefined}
        >
          <SortableContext
            items={(images || [])
              .filter((i) => !!i)
              .map((i) => i.id.toString())}
            strategy={rectSortingStrategy}
          >
            {(images || [])
              .filter((file) => !!file)
              .map((file) => (
                <SortableImageItem
                  key={file.id}
                  file={file}
                  disabled={!isEditable}
                  onSetPrimary={handleSetPrimary}
                  onDelete={handleDelete}
                />
              ))}
          </SortableContext>
        </DndContext>

        {/* Upload Trigger - only if editable */}
        {isEditable && (
          <Upload.Dragger
            multiple
            showUploadList={false}
            customRequest={handleUpload}
            className="aspect-square w-full 
  bg-zinc-900/50 border-zinc-800 border-dashed 
  hover:border-zinc-600 transition-colors 
  flex items-center justify-center 
  p-4 rounded-lg"
          >
            <div className="space-y-2">
              <p className="flex justify-center">
                <InboxOutlined className="text-3xl text-gray-500" />
              </p>
              <p className="text-xs text-gray-400">
                Click or drag images to upload
              </p>
            </div>
          </Upload.Dragger>
        )}
      </div>

      {/* Uploading Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2 bg-zinc-900 p-4 rounded-lg border border-zinc-800">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">
            Uploading...
          </h4>
          {uploadingFiles.map((file) => (
            <div key={file.uid} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>{file.name}</span>
                <span>{file.progress}%</span>
              </div>
              <Progress
                percent={file.progress}
                size="small"
                status={file.status === "error" ? "exception" : "active"}
                showInfo={false}
                strokeColor="#10b981"
                railColor="#27272a"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import axiosClient from "./axiosClient";
import { extractErrorMessage } from "./apiUtils";
import {
  ApiResponse,
  FileMetadataRequest,
  FileResponse,
  OwnerType,
} from "./types";

export const fileApi = {
  /**
   * Upload a single file
   * @param file - File object from browser
   * @param ownerType - AUCTION, USER, etc.
   * @param ownerId - ID of the owner
   * @param isPrimary - Whether it's the primary image
   * @param sortOrder - Order for sorting
   */
  uploadFile: async (
    file: File,
    ownerId: number,
    isPrimary: boolean = false,
    sortOrder: number = 0,
    onUploadProgress?: (progressEvent: any) => void,
  ): Promise<FileResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("ownerId", ownerId.toString());
    formData.append("isPrimary", isPrimary.toString());
    formData.append("sortOrder", sortOrder.toString());

    try {
      const response = await axiosClient.post<ApiResponse<FileResponse>>(
        "/files/seller/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress,
        },
      );
      return response.data.result;
    } catch (error) {
      console.error("Failed to upload file:", error);
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Update metadata for multiple files in batch
   * @param requests - List of metadata update requests
   */
  updateMetadataBatch: async (
    requests: FileMetadataRequest[],
    ownerId: number,
  ): Promise<void> => {
    try {
      await axiosClient.patch(
        `/files/seller/metadata/batch?ownerId=${ownerId}`,
        requests,
      );
    } catch (error) {
      console.error("Failed to update metadata batch:", error);
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Delete a file
   * @param id - File ID
   */
  deleteFile: async (id: number, ownerId: number): Promise<void> => {
    try {
      await axiosClient.delete(`/files/seller/${id}?ownerId=${ownerId}`);
    } catch (error) {
      console.error("Failed to delete file:", error);
      throw new Error(extractErrorMessage(error));
    }
  },
};

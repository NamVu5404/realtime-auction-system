import axiosClient from "./axiosClient";
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
    ownerType: OwnerType,
    ownerId: number,
    isPrimary: boolean = false,
    sortOrder: number = 0,
    onUploadProgress?: (progressEvent: any) => void,
  ): Promise<FileResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("ownerType", ownerType);
    formData.append("ownerId", ownerId.toString());
    formData.append("isPrimary", isPrimary.toString());
    formData.append("sortOrder", sortOrder.toString());

    try {
      const response = await axiosClient.post<ApiResponse<FileResponse>>(
        "/files/upload",
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
      throw error;
    }
  },

  /**
   * Update metadata for multiple files in batch
   * @param requests - List of metadata update requests
   */
  updateMetadataBatch: async (
    requests: FileMetadataRequest[],
  ): Promise<void> => {
    try {
      await axiosClient.patch("/files/metadata/batch", requests);
    } catch (error) {
      console.error("Failed to update metadata batch:", error);
      throw error;
    }
  },

  /**
   * Delete a file
   * @param id - File ID
   */
  deleteFile: async (id: number): Promise<void> => {
    try {
      await axiosClient.delete(`/files/${id}`);
    } catch (error) {
      console.error("Failed to delete file:", error);
      throw error;
    }
  },
};

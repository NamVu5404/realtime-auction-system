import axiosClient from "./axiosClient";
import { extractErrorMessage } from "./apiUtils";
import { ApiResponse, PageResponse, User } from "./types";

export interface UpdateUserRequest {
  name: string;
  phone?: string;
}

const userApi = {
  updateProfile: async (request: UpdateUserRequest): Promise<User> => {
    try {
      const response = await axiosClient.put<ApiResponse<User>>(
        "/users/profile",
        request,
      );
      return response.data.result;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  uploadAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axiosClient.post<ApiResponse<User>>(
        "/users/profile/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data.result;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getMyAccountAudit: async (
    page: number,
    size: number,
  ): Promise<PageResponse<any>> => {
    try {
      const response = await axiosClient.get<ApiResponse<PageResponse<any>>>(
        "/users/audit",
        {
          params: { page, size },
        },
      );
      return response.data.result;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};

export default userApi;

import axiosClient from "./axiosClient";
import { extractErrorMessage } from "./apiUtils";
import { ApiResponse, ApiResult, PageResponse, TopBidderPublicResponse, TopSellerPublicResponse, User } from "./types";

export interface UpdateUserRequest {
  name: string;
  phone?: string;
}

const userApi = {
  updateProfile: async (request: UpdateUserRequest): Promise<ApiResult<User>> => {
    try {
      const response = await axiosClient.put<ApiResponse<User>>(
        "/users/profile",
        request,
      );
      return { message: response.data.message, result: response.data.result! };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  uploadAvatar: async (file: File): Promise<ApiResult<User>> => {
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
      return { message: response.data.message, result: response.data.result! };
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
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getMe: async (): Promise<User> => {
    try {
      const response = await axiosClient.get<ApiResponse<User>>("/users/me");
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getPublicTopSellers: async (limit = 10, q?: string): Promise<TopSellerPublicResponse[]> => {
    try {
      const response = await axiosClient.get<ApiResponse<TopSellerPublicResponse[]>>(
        "/users/public/top-sellers",
        { params: { limit, ...(q ? { q } : {}) } },
      );
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getPublicTopBidders: async (limit = 10): Promise<TopBidderPublicResponse[]> => {
    try {
      const response = await axiosClient.get<ApiResponse<TopBidderPublicResponse[]>>(
        "/users/public/top-bidders",
        { params: { limit } },
      );
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};

export default userApi;

import axiosClient from "./axiosClient";
import { ApiResponse, User } from "./types";

export interface UpdateUserRequest {
  name: string;
  phone?: string;
}

const userApi = {
  updateProfile: async (request: UpdateUserRequest): Promise<User> => {
    const response = await axiosClient.put<ApiResponse<User>>(
      "/users/profile",
      request,
    );
    return response.data.result;
  },

  uploadAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append("file", file);

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
  },
};

export default userApi;

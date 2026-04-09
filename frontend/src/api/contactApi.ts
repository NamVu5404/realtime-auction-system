import axiosClient from "./axiosClient";
import { extractErrorMessage } from "./apiUtils";
import { ApiResponse, ApiResult, ContactResponse, PageResponse } from "./types";

export const contactApi = {
  getPendingContacts: async (
    page: number = 1,
    size: number = 20,
  ): Promise<PageResponse<ContactResponse>> => {
    try {
      const response = await axiosClient.get<ApiResponse<PageResponse<ContactResponse>>>(
        "/contacts/pending",
        {
          params: { page, size },
        },
      );
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getProcessedContacts: async (
    page: number = 1,
    size: number = 20,
  ): Promise<PageResponse<ContactResponse>> => {
    try {
      const response = await axiosClient.get<ApiResponse<PageResponse<ContactResponse>>>(
        "/contacts/processed",
        {
          params: { page, size },
        },
      );
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  markAsProcessed: async (id: number): Promise<ApiResult<ContactResponse>> => {
    try {
      const response = await axiosClient.patch<ApiResponse<ContactResponse>>(
        `/contacts/${id}/process`,
      );
      return { message: response.data.message, result: response.data.result! };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};

export default contactApi;

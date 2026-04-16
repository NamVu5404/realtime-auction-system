import axiosClient from "./axiosClient";
import { extractErrorMessage } from "./apiUtils";
import { ApiResponse, ApiResult, SellerRegResponse } from "./types";

export const sellerApi = {
  getMyRegistration: async (): Promise<SellerRegResponse> => {
    try {
      const response = await axiosClient.get<ApiResponse<SellerRegResponse>>(
        "/sellers/my-registration",
      );
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  registerSeller: async (): Promise<ApiResult<SellerRegResponse>> => {
    try {
      const response = await axiosClient.post<ApiResponse<SellerRegResponse>>(
        "/sellers/registration",
      );
      return { message: response.data.message, result: response.data.result! };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};

export default sellerApi;

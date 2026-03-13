import axiosClient from "./axiosClient";
import { extractErrorMessage } from "./apiUtils";
import { ApiResponse, SellerRegResponse } from "./types";

export const sellerApi = {
  getMyRegistration: async (): Promise<SellerRegResponse> => {
    try {
      const response = await axiosClient.get<ApiResponse<SellerRegResponse>>(
        "/sellers/my-registration",
      );
      return response.data.result;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  registerSeller: async (): Promise<SellerRegResponse> => {
    try {
      const response = await axiosClient.post<ApiResponse<SellerRegResponse>>(
        "/sellers/registration",
      );
      return response.data.result;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};

export default sellerApi;

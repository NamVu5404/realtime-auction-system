import axiosClient from "./axiosClient";
import { ApiResponse, SellerRegResponse } from "./types";

export const sellerApi = {
  getMyRegistration: async (): Promise<SellerRegResponse> => {
    const response = await axiosClient.get<ApiResponse<SellerRegResponse>>(
      "/sellers/my-registration",
    );
    return response.data.result;
  },

  registerSeller: async (): Promise<SellerRegResponse> => {
    const response = await axiosClient.post<ApiResponse<SellerRegResponse>>(
      "/sellers/registration",
    );
    return response.data.result;
  },
};

export default sellerApi;

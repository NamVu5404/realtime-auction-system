import axiosClient from "./axiosClient";
import { extractErrorMessage } from "./apiUtils";
import { ApiResponse, CheckoutFormResponse, PageResponse, TopUpHistoryItem, TopUpOrderStatus } from "./types";

export const paymentApi = {
  createTopUpOrder: async (amount: number): Promise<CheckoutFormResponse> => {
    try {
      const res = await axiosClient.post<ApiResponse<CheckoutFormResponse>>(
        "/payments/top-up",
        { amount }
      );
      return res.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getTopUpHistory: async (params: {
    status?: TopUpOrderStatus;
    from?: number;
    to?: number;
    page?: number;
    size?: number;
  }): Promise<PageResponse<TopUpHistoryItem>> => {
    try {
      const res = await axiosClient.get<ApiResponse<PageResponse<TopUpHistoryItem>>>(
        "/payments/top-up/history",
        { params }
      );
      return res.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};

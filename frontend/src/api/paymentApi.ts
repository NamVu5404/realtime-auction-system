import axiosClient from "./axiosClient";
import { extractErrorMessage } from "./apiUtils";
import { ApiResponse, CheckoutFormResponse } from "./types";

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
};

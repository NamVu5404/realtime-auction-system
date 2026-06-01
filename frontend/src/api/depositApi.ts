import axiosClient from "./axiosClient";
import { extractErrorMessage } from "./apiUtils";
import { ApiResponse, DepositStatusResponse, WalletResponse } from "./types";

export const depositApi = {
  placeDeposit: async (auctionId: number): Promise<DepositStatusResponse> => {
    try {
      const res = await axiosClient.post<ApiResponse<DepositStatusResponse>>(
        `/deposits/auctions/${auctionId}`
      );
      return res.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getDepositStatus: async (auctionId: number): Promise<DepositStatusResponse> => {
    try {
      const res = await axiosClient.get<ApiResponse<DepositStatusResponse>>(
        `/deposits/auctions/${auctionId}/status`
      );
      return res.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getMyDeposits: async (): Promise<DepositStatusResponse[]> => {
    try {
      const res = await axiosClient.get<ApiResponse<DepositStatusResponse[]>>(
        `/deposits/me`
      );
      return res.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getMyWallet: async (): Promise<WalletResponse> => {
    try {
      const res = await axiosClient.get<ApiResponse<WalletResponse>>(
        `/wallet/me`
      );
      return res.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};

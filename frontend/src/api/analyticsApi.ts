import axiosClient from "./axiosClient";
import { extractErrorMessage } from "./apiUtils";
import {
  ApiResponse,
  AdminKpiResponse,
  AdminAuctionOverviewResponse,
  AdminUserAnalyticsResponse,
  AdminRevenueChartResponse,
  TopPerformingResponse,
} from "./types";

export const analyticsApi = {
  getAdminKpis: async (): Promise<AdminKpiResponse> => {
    try {
      const response = await axiosClient.get<ApiResponse<AdminKpiResponse>>(
        "/analytics/admin/dashboard/kpis"
      );
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getAdminAuctionOverview: async (): Promise<AdminAuctionOverviewResponse> => {
    try {
      const response = await axiosClient.get<ApiResponse<AdminAuctionOverviewResponse>>(
        "/analytics/admin/dashboard/auction-overview"
      );
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getAdminUserAnalytics: async (): Promise<AdminUserAnalyticsResponse> => {
    try {
      const response = await axiosClient.get<ApiResponse<AdminUserAnalyticsResponse>>(
        "/analytics/admin/dashboard/user-analytics"
      );
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getAdminRevenueChart: async (period: "WEEK" | "MONTH" = "MONTH"): Promise<AdminRevenueChartResponse> => {
    try {
      const response = await axiosClient.get<ApiResponse<AdminRevenueChartResponse>>(
        "/analytics/admin/dashboard/revenue-chart",
        {
          params: { period },
        }
      );
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getTopPerformers: async (): Promise<TopPerformingResponse> => {
    try {
      const response = await axiosClient.get<ApiResponse<TopPerformingResponse>>(
        "/analytics/admin/dashboard/top-performers"
      );
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};

export default analyticsApi;

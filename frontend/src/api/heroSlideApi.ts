import axiosClient from "./axiosClient";
import { extractErrorMessage } from "./apiUtils";
import { ApiResponse, Auction, HeroSlide } from "./types";

export const heroSlideApi = {
  getPublicHeroSlides: async (): Promise<Auction[]> => {
    try {
      const response = await axiosClient.get<ApiResponse<Auction[]>>("/hero-slides");
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getAdminHeroSlides: async (): Promise<HeroSlide[]> => {
    try {
      const response = await axiosClient.get<ApiResponse<HeroSlide[]>>("/admin/hero-slides");
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  addHeroSlide: async (auctionId: number): Promise<{ message: string; result: HeroSlide }> => {
    try {
      const response = await axiosClient.post<ApiResponse<HeroSlide>>("/admin/hero-slides", { auctionId });
      return { message: response.data.message, result: response.data.result! };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  removeHeroSlide: async (id: number): Promise<string> => {
    try {
      const response = await axiosClient.delete<ApiResponse<void>>(`/admin/hero-slides/${id}`);
      return response.data.message;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  reorderHeroSlides: async (orderedIds: number[]): Promise<HeroSlide[]> => {
    try {
      const response = await axiosClient.put<ApiResponse<HeroSlide[]>>("/admin/hero-slides/reorder", { orderedIds });
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  toggleActive: async (id: number): Promise<HeroSlide> => {
    try {
      const response = await axiosClient.patch<ApiResponse<HeroSlide>>(`/admin/hero-slides/${id}/toggle`);
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};

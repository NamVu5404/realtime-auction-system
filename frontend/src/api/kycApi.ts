import axiosClient from "./axiosClient";
import { extractErrorMessage } from "./apiUtils";
import { ApiResponse, ApiResult, KycResponse } from "./types";

const kycApi = {
  recognizeId: async (
    frontImage: File,
    backImage: File,
  ): Promise<ApiResult<any>> => {
    const formData = new FormData();
    formData.append("frontImage", frontImage);
    formData.append("backImage", backImage);

    try {
      const response = await axiosClient.post<ApiResponse<any>>(
        "/kyc/recognition",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return { message: response.data.message, result: response.data.result! };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  matchFace: async (selfie: File): Promise<ApiResult<any>> => {
    const formData = new FormData();
    formData.append("selfie", selfie);

    try {
      const response = await axiosClient.post<ApiResponse<any>>(
        "/kyc/face-match",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return { message: response.data.message, result: response.data.result! };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getMyKycInfo: async (): Promise<KycResponse> => {
    try {
      const response = await axiosClient.get<ApiResponse<KycResponse>>("/kyc/me");
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getKycInfoByUserId: async (userId: string | number): Promise<KycResponse> => {
    try {
      const response = await axiosClient.get<ApiResponse<KycResponse>>(
        `/kyc/users/${userId}`,
      );
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};

export default kycApi;

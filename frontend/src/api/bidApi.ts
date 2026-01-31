import axiosClient from './axiosClient';
import { ApiResponse, PageResponse, MyBidHistoryResponse } from './types';

export const bidApi = {
	/**
	 * Fetch logged-in user's bid history (paginated)
	 * Backend expects 0-indexed `page` param. Frontend will pass 1-indexed page,
	 * so convert here to 0-index.
	 */
	getMyBidHistory: async (
		page: number = 1,
		size: number = 20
	): Promise<PageResponse<MyBidHistoryResponse>> => {
		try {
			const response = await axiosClient.get<ApiResponse<PageResponse<MyBidHistoryResponse>>>(
				'/bids/my-history',
				{
					params: {
						// Send frontend page as-is (1-indexed)
						page: page,
						size,
					},
				}
			);

			return response.data.result;
		} catch (error) {
			console.error('Failed to fetch my bid history', error);
			throw error;
		}
	},

	/**
	 * Fetch bid history for a specific user (admin only)
	 * @param userId - The user ID to fetch history for
	 * @param page - Page number (1-indexed)
	 * @param size - Page size
	 */
	getBidHistoryForAdmin: async (
		userId: number,
		page: number = 1,
		size: number = 20
	): Promise<PageResponse<MyBidHistoryResponse>> => {
		try {
			const response = await axiosClient.get<ApiResponse<PageResponse<MyBidHistoryResponse>>>(
				`/bids/users/${userId}/history`,
				{
					params: {
						page,
						size,
					},
				}
			);

			return response.data.result;
		} catch (error) {
			console.error(`Failed to fetch bid history for user ${userId}`, error);
			throw error;
		}
	},
};

export default bidApi;

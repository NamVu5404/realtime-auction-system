/**
 * Types generated from Backend Analysis
 * Source: Java DTOs and Entities
 */

/**
 * Auction Status Enum - Derived from Java AuctionStatus
 * LIVE = LIVE + SCHEDULED (startTime - now <= 1h)
 * UPCOMING = SCHEDULED (startTime - now > 1h)
 * ENDED = ENDED
 */
export enum AuctionStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

/**
 * User Role Enum
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

/**
 * Bid Status Enum - Derived from BidStatus.java
 */
export enum BidStatus {
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
}

/**
 * User Response - Derived from UserResponse.java
 */
export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

/**
 * Auction Response - Derived from AuctionResponse.java
 * All timestamps are ISO 8601 strings in UTC format from backend
 */
export interface Auction {
  id: number;
  title: string;
  description: string;
  image?: string;
  startPrice: number; // BigDecimal from Java
  currentPrice: number; // BigDecimal from Java
  minStep: number; // BigDecimal from Java
  status: AuctionStatus;
  startTime: string; // ISO 8601 UTC string - will be converted to local time in UI
  endTime: string; // ISO 8601 UTC string - will be converted to local time in UI
  antiSnipeSeconds: number;
  extensionSeconds: number;
  seller: User;
  highestBidder?: User | null;
  createdAt: string; // ISO 8601 UTC string
}

/**
 * Pagination Response - Derived from PageResponse<T>.java
 * Frontend pagination starts at 1, Backend Pageable starts at 0
 */
export interface PageResponse<T> {
  totalPage: number;
  pageSize: number;
  currentPage: number;
  totalElements: number;
  data: T[];
}

/**
 * API Response Wrapper - Derived from ApiResponse<T>.java
 * All API responses follow this format
 */
export interface ApiResponse<T> {
  code: number; // Default: 1000 for success
  message?: string;
  result: T;
}

/**
 * Paginated Auction Response for list endpoints
 */
export type PaginatedAuctions = PageResponse<Auction>;

/**
 * Single Auction Response
 */
export type SingleAuctionResponse = Auction;

/**
 * Create Auction Request - for future use
 */
export interface CreateAuctionRequest {
  title: string;
  description: string;
  image?: string;
  startPrice: number;
  minStep: number;
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
  antiSnipeSeconds?: number;
  extensionSeconds?: number;
}

/**
 * Authentication Response - from backend
 */
export interface AuthenticationResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/**
 * Place Bid Response - from backend POST /api/v1/auctions/{auctionId}/bids
 */
export interface PlaceBidResponse {
  success: boolean;
  message: string;
  currentPrice: number;
  highestBidderId: number;
  highestBidderName: string;
  timestamp: string; // ISO 8601 UTC string
  extended: boolean; // Whether time was extended due to anti-snipe
}

/**
 * Bid Update Message - WebSocket message from /topic/auction/{auctionId}
 */
export interface BidUpdateMessage {
  auctionId: number;
  currentPrice: number;
  highestBidderId: number;
  highestBidderName: string;
  bidCount: number;
  extended: boolean; // Whether this bid triggered time extension
  timestamp: string; // ISO 8601 UTC string
  newEndTime?: string; // Updated end time if extended
}

/**
 * My Bid History Response - Derived from MyBidHistoryResponse.java
 * All timestamps are ISO 8601 strings in UTC format from backend
 */
export interface MyBidHistoryResponse {
  auctionId: number;
  auctionTitle: string;
  auctionStatus: AuctionStatus;
  amount: number; // BigDecimal from Java
  currentPrice: number; // BigDecimal from Java - auction's current/final price
  status: BidStatus;
  createdAt: string; // ISO 8601 UTC string - will be converted to local time in UI
}

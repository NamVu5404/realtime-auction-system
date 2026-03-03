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
  ALL = "ALL",
  DRAFT = "DRAFT",
  SCHEDULED = "SCHEDULED",
  LIVE = "LIVE",
  ENDED = "ENDED",
  CANCELLED = "CANCELLED",
}

/**
 * User Role Enum
 */
export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

/**
 * Bid Status Enum - Derived from BidStatus.java
 */
export enum BidStatus {
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  FLAGGED = "FLAGGED",
}

export enum UserActionType {
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  BLOCKED = "BLOCKED",
  UNBLOCKED = "UNBLOCKED",
  FRAUD = "FRAUD",
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
  status?: "ACTIVE" | "BLOCKED";
}

/**
 * Owner Type Enum for files - Matches Backend OwnerType.java constant names
 */
export enum OwnerType {
  AUCTION_IMAGE = "AUCTION_IMAGE",
  NEWS = "NEWS",
  HOME_THUMBNAIL = "HOME_THUMBNAIL",
  USER_AVATAR = "USER_AVATAR",
}

/**
 * File Response Interface
 */
export interface FileResponse {
  id: number;
  filePath: string;
  storageName: string;
  ownerId: number;
  sortOrder: number;
  isPrimary: boolean;
}

/**
 * File Metadata Request Interface
 */
export interface FileMetadataRequest {
  id: number;
  isPrimary: boolean;
  sortOrder: number;
}

/**
 * Auction Response - Derived from AuctionResponse.java
 * All timestamps are ISO 8601 strings in UTC format from backend
 */
export interface Auction {
  id: number;
  title: string;
  description: string;
  image?: string; // Legacy field
  images?: FileResponse[]; // New field
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
 * Introspect Request - Derived from IntrospectRequest.java
 */
export interface IntrospectRequest {
  accessToken: string;
}

/**
 * Introspect Response - Derived from IntrospectResponse.java
 */
export interface IntrospectResponse {
  valid: boolean;
}

/**
 * Refresh Request - Derived from RefreshRequest.java
 */
export interface RefreshRequest {
  accessToken: string;
  refreshToken: string;
}

/**
 * Refresh Response - Derived from RefreshResponse.java
 */
export interface RefreshResponse {
  accessToken: string;
}

/**
 * Logout Request - Derived from LogoutRequest.java
 */
export interface LogoutRequest {
  accessToken: string;
  refreshToken: string;
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
 * Place Bid Response V2 - from backend POST /v2/auctions/{auctionId}/bids
 */
export interface PlaceBidResponseV2 {
  success: boolean;
  message: string;
  newPrice: number;
  highestBidderId: number;
  highestBidderName: string; // Added by user
  timestamp: string | number; // ISO 8601 UTC string or Epoch seconds
  extended: boolean;
  version: number;
  finalEndTime?: string;
}

/**
 * Bid Update Message - WebSocket message from /topic/auction/{auctionId}
 */
export interface BidUpdateMessage {
  auctionId: number;
  currentPrice?: number;
  amount?: number; // V2 field
  highestBidderId?: number;
  bidderId?: number; // V2 field
  highestBidderName?: string;
  bidderName?: string; // Matching V2 backend field
  bidCount?: number;
  extended: boolean;
  timestamp: string | number;
  finalEndTime?: string;
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
/**
 * User Audit Response - Account audit history
 * Derived from UserAuditResponse.java
 * Details is a flexible Map that varies by action type
 */
export interface UserAuditResponse {
  id: number;
  actionType: UserActionType;
  details: Record<string, any>; // Flexible map from backend (fraudType, bidId, reason, by, etc.)
  createdAt: string; // ISO 8601 UTC string
}

/**
 * Auction History Response - Derived from AuctionHistoryResponse.java
 */
export interface AuctionHistoryResponse {
  bidderId: number;
  bidderEmail: string;
  amount: number; // BigDecimal from Java
  timestamp: string; // ISO 8601 UTC string
  status: BidStatus;
}

/**
 * Cancel Auction Request - Derived from CancelAuctionRequest.java
 */
export interface CancelAuctionRequest {
  reason: string;
}

/**
 * Cancel Auction Response - Derived from CancelAuctionResponse.java
 */
export interface CancelAuctionResponse {
  auctionId: number;
  reason: string;
  timestamp: string; // Instant from Java
  by: string;
}

/**
 * Auction Action Type - Derived from AuctionActionType.java
 */
export enum AuctionActionType {
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  CANCELLED = "CANCELLED",
  START = "START",
  END = "END",
  RESULT = "RESULT",
  FRAUD = "FRAUD",
}

/**
 * Auction Audit Response - Derived from AuctionAuditResponse.java
 */
export interface AuctionAuditResponse {
  id: number;
  actionType: AuctionActionType;
  createdAt: string; // ISO 8601 UTC string
  details: Record<string, any>;
  updatedBy: string;
}

/**
 * Types generated from Backend Analysis
 * Source: Java DTOs and Entities
 */

/**
 * Auction Status Enum - Derived from Java AuctionStatus
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
  SELLER = "SELLER",
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
  SELLER_ROLE_REVOKED = "SELLER_ROLE_REVOKED",
  SELLER_APPROVED = "SELLER_APPROVED",
  SELLER_REJECTED = "SELLER_REJECTED",
}

export enum AuctionActionType {
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  CANCELLED = "CANCELLED",
  START = "START",
  END = "END",
  RESULT = "RESULT",
  FRAUD = "FRAUD",
}

export enum RequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

/**
 * User Response - Derived from UserResponse.java
 */
export interface User {
  id: number;
  email: string;
  name: string;
  roles: UserRole[];
  avatarUrl?: string;
  status?: "ACTIVE" | "BLOCKED";
  phone?: string;
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
 * Auction Response - Derived from AuctionResponse.java
 */
export interface Auction {
  id: number;
  title: string;
  description: string;
  image?: string;
  images?: FileResponse[];
  startPrice: number;
  currentPrice: number;
  minStep: number;
  status: AuctionStatus;
  startTime: string;
  endTime: string;
  antiSnipeSeconds: number;
  extensionSeconds: number;
  seller: User;
  highestBidder?: User | null;
  createdAt: string;
}

/**
 * Auction State Snapshot - Derived from AuctionStateSnapshot.java
 * Returned by GET /v1/auctions/{id}/state
 * Used as lightweight polling fallback when Kafka pipeline is down
 */
export interface AuctionStateSnapshot {
  currentPrice: number;
  highestBidderId: number | null;
  highestBidderName: string | null;
  highestBidderEmail: string | null;
  endTime: string; // ISO string - reflects actual endTime including anti-snipe extensions
}

/**
 * Pagination Response - Derived from PageResponse<T>.java
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
 */
/**
 * API Response Wrapper — mirrors backend ApiResponse<T> + ValidationErrorResponse.
 * - `code`: SuccessCode (1xxx–3xxx) or ErrorCode (4xxx+, 9999)
 * - `message`: always present from backend SuccessCode/ErrorCode
 * - `result`: present on success, omitted (undefined) on error (@JsonInclude NON_NULL)
 * - `errors`: only present for validation failures (ValidationErrorResponse extends ApiResponse)
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  result?: T;
  errors?: Record<string, string>;
}

/**
 * ApiResult<T> — returned by API layer functions used in mutations
 * so that `onSuccess(data)` can call `message.success(data.message)`
 * using the exact backend message instead of hardcoded strings.
 */
export interface ApiResult<T> {
  message: string;
  result: T;
}

export type PaginatedAuctions = PageResponse<Auction>;
export type SingleAuctionResponse = Auction;

export interface CreateAuctionRequest {
  title: string;
  description: string;
  image?: string;
  startPrice: number;
  minStep: number;
  startTime: string;
  endTime: string;
  antiSnipeSeconds?: number;
  extensionSeconds?: number;
}

export interface AuthenticationResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface IntrospectRequest {
  accessToken: string;
}

export interface IntrospectResponse {
  valid: boolean;
}

export interface RefreshRequest {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface LogoutRequest {
  accessToken: string;
  refreshToken: string;
}

/**
 * Place Bid Response V2 - from backend POST /v2/auctions/{auctionId}/bids
 */
export interface PlaceBidResponseV2 {
  success: boolean;
  message: string;
  newPrice: number;
  highestBidderId: number;
  highestBidderName: string;
  timestamp: string | number;
  extended: boolean;
  highestBidderRoles?: UserRole[];
  version: number;
  finalEndTime?: string;
}

/**
 * My Bid History Response - Derived from MyBidHistoryResponse.java
 */
export interface MyBidHistoryResponse {
  auctionId: number;
  auctionTitle: string;
  auctionStatus: AuctionStatus;
  amount: number;
  currentPrice: number;
  status: BidStatus;
  createdAt: string;
}

/**
 * User Audit Response - Account audit history
 */
export interface UserAuditResponse {
  id: number;
  actionType: UserActionType;
  details: Record<string, any>;
  createdAt: string;
}

/**
 * Auction Audit Response - Derived from AuctionAuditResponse.java
 */
export interface AuctionAuditResponse {
  id: number;
  actionType: AuctionActionType;
  createdAt: string;
  details: Record<string, any>;
  updatedBy: string;
}

/**
 * Cancel Auction Request/Response
 */
export interface CancelAuctionRequest {
  reason: string;
}

export interface CancelAuctionResponse {
  auctionId: number;
  reason: string;
  timestamp: string;
  by: string;
}

/**
 * Seller Registration Response - Updated to include full User object
 */
export interface SellerRegResponse {
  id: number;
  user: User; // Changed from userId, userName, userEmail
  status: RequestStatus;
  approvedAt?: string;
  rejectReason?: string;
}

/**
 * Place Bid Response - from backend POST /v1/auctions/{auctionId}/bids
 */
export interface PlaceBidResponse {
  success: boolean;
  message: string;
  currentPrice: number;
  highestBidderId: number;
  highestBidderName: string;
  timestamp: string | number;
  extended: boolean;
}

/**
 * Auction History Response - for bid logs
 */
export interface AuctionHistoryResponse {
  bidderId: number;
  bidderEmail: string;
  amount: number;
  timestamp: string;
  status: BidStatus;
}

/**
 * WebSocket Bid Update Message
 */
export interface BidUpdateMessage {
  auctionId: number;
  currentPrice?: number;
  amount?: number;
  highestBidderId?: number;
  bidderId?: number;
  highestBidderName?: string;
  bidderName?: string;
  roles?: UserRole[];
  finalEndTime?: string;
  extended?: boolean;
  timestamp?: string | number;
}

/**
 * File Metadata Request - for batch updates
 */
export interface FileMetadataRequest {
  id: number;
  isPrimary?: boolean;
  sortOrder?: number;
}

/**
 * Owner Type Enum - for file management
 */
export enum OwnerType {
  AUCTION_IMAGE = "AUCTION_IMAGE",
  NEWS = "NEWS",
  HOME_THUMBNAIL = "HOME_THUMBNAIL",
  USER_AVATAR = "USER_AVATAR",
}
/**
 * Contact Request/Response - Derived from Contact module
 */
export interface ContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  description: string;
}

export interface ContactResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  description: string;
  processed: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

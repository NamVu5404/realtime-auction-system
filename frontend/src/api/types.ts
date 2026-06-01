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
  PENDING_REVIEW = "PENDING_REVIEW",
  SCHEDULED = "SCHEDULED",
  LIVE = "LIVE",
  ENDED = "ENDED",
  ENDED_NO_SALE = "ENDED_NO_SALE",
  CANCELLED = "CANCELLED",
  REJECTED = "REJECTED",
}

export enum AiReviewDecision {
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  FALLBACK_TO_ADMIN = "FALLBACK_TO_ADMIN",
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
  BAN_CHAT = "BAN_CHAT",
  UNBAN_CHAT = "UNBAN_CHAT",
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
  bannedUntil?: string; // ISO date string if user is banned from chat
  isVerifiedIdentity?: boolean;
  isFaceMatch?: boolean;
}

/**
 * Seller Response - Derived from SellerResponse.java interface
 */
export interface SellerResponse {
  userId: number;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  location?: string;
  isAdmin?: boolean;
  approvedAt?: string;
  totalAuctions: number;
  liveAuctions: number;
  endedAuctions: number;
  totalRevenue: number;
}

/**
 * Kyc Response - Derived from KycResponse.java
 */
export interface KycResponse {
  userId: number;
  cccdNumber: string;
  name: string;
  dob: string;
  sex: string;
  address: string;
  doe: string;
  frontImageUrl: string;
  backImageUrl: string;
  faceMatchUrl: string;
  createdAt: string;
  updatedAt: string;
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
  reservePrice?: number;
  privateMode?: boolean;
  seller: User;
  highestBidder?: User | null;
  createdAt: string;
  // Deposit config
  depositRequired: boolean;
  depositRate?: number | null;
  depositCutoffMinutes?: number | null;
  depositAmount?: number | null; // computed: startPrice * depositRate
}

export enum DepositStatus {
  LOCKED = "LOCKED",
  RELEASED = "RELEASED",
  FORFEITED = "FORFEITED",
}

export interface DepositStatusResponse {
  hasDeposit: boolean;
  auctionId: number;
  depositAmount: number | null;
  status: DepositStatus | null;
  createdAt: string | null;
  releasedAt: string | null;
}

export interface WalletResponse {
  userId: number;
  availableBalance: number;
  lockedBalance: number;
  totalBalance: number;
  updatedAt: string;
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
  reservePrice?: number;
  privateMode?: boolean;
  depositRequired?: boolean;
  depositRate?: number | null;
  depositCutoffMinutes?: number | null;
}

export interface UpdateDraftAuctionRequest {
  title?: string;
  description?: string;
  image?: string;
  startPrice?: number;
  minStep?: number;
  startTime?: string;
  endTime?: string;
  reservePrice?: number;
  privateMode?: boolean;
  antiSnipeSeconds?: number;
  extensionSeconds?: number;
  depositRequired?: boolean;
  depositRate?: number | null;
  depositCutoffMinutes?: number | null;
}

export interface UpdateScheduledAuctionRequest {
  description?: string;
  image?: string;
  startTime?: string;
  endTime?: string;
  reservePrice?: number;
  privateMode?: boolean;
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
  image: string;
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
 * AI Review Log - Derived from AiReviewLog.java
 */
export interface AiLogCountResponse {
  total: number;
  approved: number;
  rejected: number;
  fallbackToAdmin: number;
}

export interface AiReviewLog {
  id: number;
  auctionId: number;
  auctionTitle?: string;
  decision: AiReviewDecision;
  confidence?: number;
  reasons?: string;
  responseTimeMs?: number;
  model?: string;
  errorMessage?: string;
  createdAt: string;
}

export enum AuctionActionType {
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  CANCELLED = "CANCELLED",
  START = "START",
  END = "END",
  ENDED_NO_SALE = "ENDED_NO_SALE",
  RESULT = "RESULT",
  FRAUD = "FRAUD",
  RELIST = "RELIST",
  PENDING_REVIEW = "PENDING_REVIEW",
  AI_REVIEW_APPROVED = "AI_REVIEW_APPROVED",
  AI_REVIEW_REJECTED = "AI_REVIEW_REJECTED",
  AI_REVIEW_FALLBACK = "AI_REVIEW_FALLBACK",
  ADMIN_REVIEW_APPROVED = "ADMIN_REVIEW_APPROVED",
  ADMIN_REVIEW_REJECTED = "ADMIN_REVIEW_REJECTED",
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

export interface BidChartData {
  periodLabel: string;
  bidCount: number;
  auctionsParticipated: number;
}

export interface MyBidStatsResponse {
  totalAuctionsParticipated: number;
  totalWins: number;
  totalBids: number;
  highestWinningBid: number;
  totalSpent: number;
  activeLeading: number;
  activityChart: BidChartData[];
}

export interface SellerChartData {
  periodLabel: string;
  auctionsCompleted: number;
  revenue: number;
}

export interface SellerStatsResponse {
  totalRevenue: number;
  totalAuctionsCreated: number;
  totalAuctionsSold: number;
  activeAuctions: number;
  pendingReviewCount: number;
  rejectedCount: number;
  totalBidsReceived: number;
  highestSoldPrice: number;
  totalUniqueBidders: number;
  totalAuctionsEnded: number;
  revenueChart: SellerChartData[];
}

/**
 * Admin Analytics Types
 */

export interface AdminKpiResponse {
  totalPlatformRevenue: number;
  liveAuctions: number;
  totalUsers: number;
  totalSellers: number;
  pendingSellerRequests: number;
  pendingContacts: number;
}

export interface AdminAuctionOverviewResponse {
  totalAuctions: number;
  liveCount: number;
  scheduledCount: number;
  pendingReviewCount: number;
  rejectedCount: number;
  endedCount: number;
  endedNoSaleCount: number;
  cancelledCount: number;
  draftCount: number;
  successRate: number;
  totalBidsAllTime: number;
  avgBidsPerAuction: number;
  publicCount: number;
  privateCount: number;
}

export interface CountryStatData {
  country: string;
  userCount: number;
}

export interface AdminUserAnalyticsResponse {
  totalUsers: number;
  newUsersThisMonth: number;
  blockedUsers: number;
  usersByCountry: CountryStatData[];
}

export interface AdminChartPoint {
  periodLabel: string;
  revenue: number;
  bidCount: number;
}

export interface AdminRevenueChartResponse {
  totalRevenue: number;
  totalBids: number;
  chartData: AdminChartPoint[];
}

/**
 * Top Performers Types
 */

export interface TopSellerPublicResponse {
  id: number;
  name: string;
  avatarUrl?: string;
  location?: string;
  isVerifiedIdentity: boolean;
  totalAuctions: number;
  liveAuctions: number;
  soldAuctions: number;
}

export interface TopSellerData {
  sellerId: number;
  name: string;
  email: string;
  avatarUrl?: string;
  totalRevenue: number;
  auctionCount: number;
}

export interface MostActiveAuctionData {
  auctionId: number;
  title: string;
  bidCount: number;
  currentPrice: number;
  status: string;
}

export interface TopPerformingResponse {
  topSellers: TopSellerData[];
  mostActiveAuctions: MostActiveAuctionData[];
}

export interface TopBidderPublicResponse {
  id: number;
  name: string;
  avatarUrl?: string;
  location?: string;
  totalBids: number;
  totalAuctionsParticipated: number;
  totalWins: number;
}

export interface RecentBidFeedResponse {
  bidderName: string;
  bidderAvatarUrl?: string;
  auctionTitle: string;
  auctionId: number;
  amount: number;
  createdAt: string;
}

/**
 * Live Chat Types — Derived from LiveChatResponse.java & LiveChatRequest.java
 */
export interface LiveChatMessage {
  id?: number; // Present for history messages (from REST), absent for real-time WS broadcasts
  auctionId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  senderRole?: UserRole; // Prioritized role of the sender
  content: string;
  hidden?: boolean; // True if the message was hidden by an admin
  createdAt?: string; // ISO string — present in history, absent in WS broadcast
}

export interface LiveChatRequest {
  content: string;
}

export interface ListLiveChatResponse {
  data: LiveChatMessage[];
}

export interface WishListResponse {
  id: number;
  auctionId: number;
  title: string;
  image?: string;
  startPrice: number;
  currentPrice: number;
  status: AuctionStatus;
  startTime: string;
  endTime: string;
  sellerName?: string;
  privateMode?: boolean;
  createdAt: string;
}


export interface HeroSlide {
  id: number;
  auctionId: number;
  auctionTitle: string;
  auctionImage?: string;
  auctionStatus: AuctionStatus;
  position: number;
  active: boolean;
}

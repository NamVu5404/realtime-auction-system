/**
 * Central Types File
 *
 * This file re-exports types from api/types.ts for backward compatibility
 * New types are defined in api/types.ts based on backend analysis
 */

// Re-export types generated from backend analysis
export type {
  AuctionStatus,
  UserRole,
  User,
  Auction,
  PageResponse,
  ApiResponse,
  PaginatedAuctions,
  SingleAuctionResponse,
  CreateAuctionRequest,
  AuthenticationResponse,
  IntrospectRequest,
  IntrospectResponse,
  RefreshRequest,
  RefreshResponse,
  SellerRegResponse,
  RequestStatus,
  PlaceBidResponse,
  AuctionHistoryResponse,
  BidUpdateMessage,
  FileMetadataRequest,
  OwnerType,
} from "../api/types";
export { UserActionType } from "../api/types";
export type { LogoutRequest as AuthLogoutRequest } from "../api/types";

// Legacy types for authentication and WebSocket (keep for now)
export interface ExchangeTokenRequest {
  code: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  roles: string[];
  phone?: string;
  isVerifiedIdentity?: boolean;
  isFaceMatch?: boolean;
}

export interface ExchangeTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserInfo;
}

export interface RefreshTokenRequest {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutRequest {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: ExchangeTokenResponse["user"] | null;
  isAuthenticated: boolean;
}

/**
 * WebSocket Event Types
 */
export interface BidRequest {
  auctionId: string;
  bidAmount: number;
}

export interface BidResponse {
  success: boolean;
  message: string;
  currentPrice?: number;
  bidId?: string;
}

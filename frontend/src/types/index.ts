/**
 * Central Types File
 *
 * This file re-exports types from api/types.ts for backward compatibility
 * New types are defined in api/types.ts based on backend analysis
 */

// Re-export types generated from backend analysis
export {
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
  LogoutRequest as AuthLogoutRequest,
} from "../api/types";

// Legacy types for authentication and WebSocket (keep for now)
export interface ExchangeTokenRequest {
  code: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: "USER" | "ADMIN";
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
export interface BidUpdateMessage {
  auctionId: string;
  currentPrice: number;
  highestBidderId: string;
  highestBidderName: string;
  timestamp: string;
}

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

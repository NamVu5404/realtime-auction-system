export enum AuctionStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  SETTLED = 'SETTLED',
  CANCELLED = 'CANCELLED',
}

export interface AuctionItem {
  id: string;
  title: string;
  description: string;
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
  startPrice: number;
  currentPrice: number;
  minStep: number;
  status: AuctionStatus;
  sellerId: string;
  sellerName: string;
  imageUrl?: string;
  highestBidderId?: string;
  highestBidderName?: string;
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

export interface ExchangeTokenRequest {
  code: string;
}

export interface ExchangeTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: 'USER' | 'ADMIN';
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: ExchangeTokenResponse['user'] | null;
  isAuthenticated: boolean;
}

export interface PricePingEvent {
  auctionId: string;
  currentPrice: number;
  highestBidderId: string;
  highestBidderName: string;
  timestamp: string;
}

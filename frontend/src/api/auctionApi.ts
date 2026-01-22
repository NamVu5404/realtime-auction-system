import axiosClient from './axiosClient';
import { AuctionItem, BidRequest, BidResponse, AuctionStatus } from '../types';

// Mock data generator
const generateMockAuctions = (): AuctionItem[] => {
  const now = new Date();

  // LIVE auctions
  const liveSince = new Date(now.getTime() - 30 * 60000); // 30 mins ago
  const liveUntil = new Date(now.getTime() + 30 * 60000); // 30 mins from now

  // UPCOMING < 1 hour
  const upcomingShortStart = new Date(now.getTime() + 15 * 60000); // 15 mins
  const upcomingShortEnd = new Date(upcomingShortStart.getTime() + 60 * 60000); // 1 hour duration

  // UPCOMING > 1 hour
  const upcomingLongStart = new Date(now.getTime() + 2 * 60 * 60000); // 2 hours
  const upcomingLongEnd = new Date(upcomingLongStart.getTime() + 60 * 60000); // 1 hour duration

  // ENDED
  const endedStart = new Date(now.getTime() - 4 * 60 * 60000); // 4 hours ago
  const endedEnd = new Date(now.getTime() - 2 * 60 * 60000); // 2 hours ago

  return [
    // LIVE auctions
    {
      id: 'auction-1',
      title: 'Vintage Camera Collection',
      description: 'Rare vintage cameras from the 1950s-1970s',
      startTime: liveSince.toISOString(),
      endTime: liveUntil.toISOString(),
      startPrice: 100,
      currentPrice: 450,
      minStep: 10,
      status: AuctionStatus.LIVE,
      sellerId: 'seller-1',
      sellerName: 'John Collector',
      imageUrl: 'https://via.placeholder.com/300x200?text=Camera',
      highestBidderId: 'bidder-5',
      highestBidderName: 'Emma Wilson',
    },
    {
      id: 'auction-2',
      title: 'Signed First Edition Books',
      description: 'Collection of signed first editions by famous authors',
      startTime: liveSince.toISOString(),
      endTime: liveUntil.toISOString(),
      startPrice: 50,
      currentPrice: 320,
      minStep: 5,
      status: AuctionStatus.LIVE,
      sellerId: 'seller-2',
      sellerName: 'Mary Book Dealer',
      imageUrl: 'https://via.placeholder.com/300x200?text=Books',
      highestBidderId: 'bidder-3',
      highestBidderName: 'Michael Chen',
    },
    // UPCOMING < 1 hour
    {
      id: 'auction-3',
      title: 'Gaming Console Bundle',
      description: 'Latest generation gaming console with accessories',
      startTime: upcomingShortStart.toISOString(),
      endTime: upcomingShortEnd.toISOString(),
      startPrice: 200,
      currentPrice: 200,
      minStep: 20,
      status: AuctionStatus.SCHEDULED,
      sellerId: 'seller-3',
      sellerName: 'Tech Store',
      imageUrl: 'https://via.placeholder.com/300x200?text=Console',
    },
    {
      id: 'auction-4',
      title: 'Smartphone Auction',
      description: 'Flagship smartphone, lightly used, excellent condition',
      startTime: upcomingShortStart.toISOString(),
      endTime: upcomingShortEnd.toISOString(),
      startPrice: 400,
      currentPrice: 400,
      minStep: 25,
      status: AuctionStatus.SCHEDULED,
      sellerId: 'seller-4',
      sellerName: 'Electronics Hub',
      imageUrl: 'https://via.placeholder.com/300x200?text=Phone',
    },
    // UPCOMING > 1 hour
    {
      id: 'auction-5',
      title: 'Designer Handbag',
      description: 'Authentic designer handbag, new condition',
      startTime: upcomingLongStart.toISOString(),
      endTime: upcomingLongEnd.toISOString(),
      startPrice: 150,
      currentPrice: 150,
      minStep: 10,
      status: AuctionStatus.SCHEDULED,
      sellerId: 'seller-5',
      sellerName: 'Fashion Boutique',
      imageUrl: 'https://via.placeholder.com/300x200?text=Bag',
    },
    {
      id: 'auction-6',
      title: 'Mountain Bike',
      description: 'High-end mountain bike, professional grade',
      startTime: upcomingLongStart.toISOString(),
      endTime: upcomingLongEnd.toISOString(),
      startPrice: 500,
      currentPrice: 500,
      minStep: 50,
      status: AuctionStatus.SCHEDULED,
      sellerId: 'seller-6',
      sellerName: 'Sports Equipment',
      imageUrl: 'https://via.placeholder.com/300x200?text=Bike',
    },
    // ENDED auctions
    {
      id: 'auction-7',
      title: 'Original Vinyl Records',
      description: 'Collection of original vinyl records from 1980s',
      startTime: endedStart.toISOString(),
      endTime: endedEnd.toISOString(),
      startPrice: 75,
      currentPrice: 280,
      minStep: 10,
      status: AuctionStatus.ENDED,
      sellerId: 'seller-7',
      sellerName: 'Music Collector',
      imageUrl: 'https://via.placeholder.com/300x200?text=Vinyl',
      highestBidderId: 'bidder-1',
      highestBidderName: 'David Brown',
    },
    {
      id: 'auction-8',
      title: 'Antique Watch',
      description: 'Swiss-made antique pocket watch, 1920s',
      startTime: endedStart.toISOString(),
      endTime: endedEnd.toISOString(),
      startPrice: 200,
      currentPrice: 1200,
      minStep: 50,
      status: AuctionStatus.ENDED,
      sellerId: 'seller-8',
      sellerName: 'Antique Dealer',
      imageUrl: 'https://via.placeholder.com/300x200?text=Watch',
      highestBidderId: 'bidder-2',
      highestBidderName: 'Sarah Johnson',
    },
  ];
};

// Mocked API functions with simulated delays
export const auctionApi = {
  // Get all auctions
  getAllAuctions: async (): Promise<AuctionItem[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(generateMockAuctions());
      }, 500); // Simulate network latency
    });
  },

  // Get auction by ID
  getAuctionById: async (auctionId: string): Promise<AuctionItem | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const auctions = generateMockAuctions();
        const auction = auctions.find(a => a.id === auctionId) || null;
        resolve(auction);
      }, 300);
    });
  },

  // Place a bid
  placeBid: async (request: BidRequest): Promise<BidResponse> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const auctions = generateMockAuctions();
        const auction = auctions.find(a => a.id === request.auctionId);

        if (!auction) {
          reject(new Error('Auction not found'));
          return;
        }

        if (auction.status !== 'LIVE') {
          reject(new Error('Auction is not live'));
          return;
        }

        const minimumBid = auction.currentPrice + auction.minStep;

        if (request.bidAmount < minimumBid) {
          reject(new Error(`Bid must be at least ${minimumBid}`));
          return;
        }

        resolve({
          success: true,
          message: 'Bid placed successfully',
          currentPrice: request.bidAmount,
          bidId: `bid-${Date.now()}`,
        });
      }, 400);
    });
  },

  // Get auction bid history
  getBidHistory: async (auctionId: string): Promise<any[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { bidId: 'bid-1', bidderId: 'bidder-1', amount: 150, timestamp: new Date().toISOString() },
          { bidId: 'bid-2', bidderId: 'bidder-2', amount: 175, timestamp: new Date().toISOString() },
          { bidId: 'bid-3', bidderId: 'bidder-3', amount: 200, timestamp: new Date().toISOString() },
        ]);
      }, 300);
    });
  },
};

// Real API calls (when backend is ready)
export const auctionApiReal = {
  getAllAuctions: () => axiosClient.get<AuctionItem[]>('/auctions'),
  getAuctionById: (auctionId: string) => axiosClient.get<AuctionItem>(`/auctions/${auctionId}`),
  placeBid: (request: BidRequest) => axiosClient.post<BidResponse>('/bids/place', request),
  getBidHistory: (auctionId: string) => axiosClient.get<any[]>(`/auctions/${auctionId}/bids`),
};

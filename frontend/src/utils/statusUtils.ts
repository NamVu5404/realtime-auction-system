import { AuctionStatus } from '../api/types';

/**
 * Get Ant Design Tag color for auction status
 * 
 * Color Mapping:
 * - DRAFT: 'default' (grey)
 * - SCHEDULED: 'blue'
 * - LIVE: 'green'
 * - ENDED: 'red'
 * - CANCELLED: 'red'
 */
export const getStatusColor = (status: AuctionStatus): string => {
  switch (status) {
    case AuctionStatus.LIVE:
      return 'green';
    case AuctionStatus.DRAFT:
      return 'default';
    case AuctionStatus.PENDING_REVIEW:
      return 'processing';
    case AuctionStatus.SCHEDULED:
      return 'blue';
    case AuctionStatus.ENDED:
      return 'red';
    case AuctionStatus.ENDED_NO_SALE:
      return 'orange';
    case AuctionStatus.CANCELLED:
      return 'red';
    case AuctionStatus.REJECTED:
      return 'error';
    default:
      return 'default';
  }
};

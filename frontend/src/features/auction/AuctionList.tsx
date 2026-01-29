import { Row, Col, Empty, Pagination } from 'antd';
import { Auction } from '../../api/types';
import AuctionCard from './AuctionCard';
import { memo } from 'react';

interface AuctionListProps {
  auctions: Auction[];
  onCountdownComplete?: () => void;
  emptyMessage?: string;
  // Pagination props
  currentPage?: number; // frontend 1-indexed
  pageSize?: number;
  totalElements?: number;
  onPageChange?: (page: number) => void;
}

/**
 * Renders a grid of auction cards
 * 
 * @param auctions - Array of auction items to display
 * @param onCountdownComplete - Callback when countdown reaches 00:00:00
 * @param emptyMessage - Message to show when no auctions
 */
export const AuctionList = memo(
  ({
    auctions,
    onCountdownComplete,
    emptyMessage = 'No auctions found',
    currentPage = 1,
    pageSize = 20,
    totalElements = 0,
    onPageChange,
  }: AuctionListProps) => {
    if (!auctions || auctions.length === 0) {
      return <Empty description={emptyMessage} />;
    }

    return (
      <div>
        <Row gutter={[16, 16]} className="w-full">
          {auctions.map((auction) => (
            <Col key={auction.id} xs={24} sm={12} md={8} lg={6}>
              <AuctionCard
                auction={auction}
                onCountdownComplete={onCountdownComplete}
              />
            </Col>
          ))}
        </Row>

        {/* Pagination - server-side */}
        {totalElements > pageSize && (
          <div className="mt-6 flex justify-center">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalElements}
              onChange={(p) => onPageChange?.(p)}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip render), false if different (do render)
    return (
      prevProps.auctions === nextProps.auctions &&
      prevProps.onCountdownComplete === nextProps.onCountdownComplete &&
      prevProps.emptyMessage === nextProps.emptyMessage &&
      prevProps.currentPage === nextProps.currentPage &&
      prevProps.pageSize === nextProps.pageSize &&
      prevProps.totalElements === nextProps.totalElements &&
      prevProps.onPageChange === nextProps.onPageChange
    );
  }
);

AuctionList.displayName = 'AuctionList';

export default AuctionList;

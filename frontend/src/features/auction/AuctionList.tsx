import { Row, Col, Empty } from 'antd';
import { Auction } from '../../api/types';
import AuctionCard from './AuctionCard';

interface AuctionListProps {
  auctions: Auction[];
  onCountdownComplete?: () => void;
  emptyMessage?: string;
}

/**
 * Renders a grid of auction cards
 * 
 * @param auctions - Array of auction items to display
 * @param onCountdownComplete - Callback when countdown reaches 00:00:00
 * @param emptyMessage - Message to show when no auctions
 */
export const AuctionList = ({ 
  auctions, 
  onCountdownComplete, 
  emptyMessage = 'No auctions found' 
}: AuctionListProps) => {
  if (auctions.length === 0) {
    return <Empty description={emptyMessage} />;
  }

  return (
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
  );
};

export default AuctionList;

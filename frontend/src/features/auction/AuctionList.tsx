import { Row, Col, Empty, Spin } from 'antd';
import dayjs from 'dayjs';
import { AuctionItem } from '../../types';
import AuctionCard from './AuctionCard';

interface AuctionListProps {
  auctions: AuctionItem[];
  loading: boolean;
  emptyMessage?: string;
}

export const AuctionList = ({ auctions, loading, emptyMessage = 'No auctions found' }: AuctionListProps) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading auctions..." />
      </div>
    );
  }

  if (auctions.length === 0) {
    return <Empty description={emptyMessage} />;
  }

  return (
    <Row gutter={[16, 16]} className="w-full">
      {auctions.map((auction) => (
        <Col key={auction.id} xs={24} sm={12} md={8} lg={6}>
          <AuctionCard auction={auction} />
        </Col>
      ))}
    </Row>
  );
};

export default AuctionList;

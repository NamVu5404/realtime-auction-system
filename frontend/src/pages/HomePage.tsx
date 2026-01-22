import { useState, useEffect } from 'react';
import { Tabs, Spin, message, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { AuctionItem } from '../types';
import { auctionApi } from '../api/auctionApi';
import { useWebSocket } from '../hooks/useWebSocket';
import AuctionList from '../features/auction/AuctionList';

export const HomePage = () => {
  const [allAuctions, setAllAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('live');

  const { isConnected } = useWebSocket({
    onPriceUpdate: (event) => {
      console.log('Price update received:', event);
      // Update local state with new price
      setAllAuctions(prev =>
        prev.map(auction =>
          auction.id === event.auctionId
            ? { ...auction, currentPrice: event.currentPrice, highestBidderId: event.highestBidderId }
            : auction
        )
      );
    },
  });

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const data = await auctionApi.getAllAuctions();
      setAllAuctions(data);
    } catch (error) {
      message.error('Failed to fetch auctions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  // Filter logic for different tabs
  const getLiveAuctions = () => {
    const now = dayjs();
    return allAuctions.filter(auction => {
      if (auction.status === 'LIVE') return true;
      // Include SCHEDULED auctions that start within 1 hour
      if (auction.status === 'SCHEDULED') {
        const timeTilStart = dayjs(auction.startTime).diff(now);
        return timeTilStart > 0 && timeTilStart < 3600000; // < 1 hour in ms
      }
      return false;
    });
  };

  const getUpcomingAuctions = () => {
    const now = dayjs();
    return allAuctions.filter(auction => {
      if (auction.status !== 'SCHEDULED') return false;
      const timeTilStart = dayjs(auction.startTime).diff(now);
      return timeTilStart >= 3600000; // >= 1 hour
    });
  };

  const getEndedAuctions = () => {
    return allAuctions.filter(
      auction => auction.status === 'ENDED' || auction.status === 'SETTLED'
    );
  };

  const tabs = [
    {
      key: 'live',
      label: `LIVE (${getLiveAuctions().length})`,
      children: (
        <AuctionList
          auctions={getLiveAuctions()}
          loading={loading}
          emptyMessage="No live or starting soon auctions"
        />
      ),
    },
    {
      key: 'upcoming',
      label: `UPCOMING (${getUpcomingAuctions().length})`,
      children: (
        <AuctionList
          auctions={getUpcomingAuctions()}
          loading={loading}
          emptyMessage="No upcoming auctions"
        />
      ),
    },
    {
      key: 'ended',
      label: `ENDED (${getEndedAuctions().length})`,
      children: (
        <AuctionList
          auctions={getEndedAuctions()}
          loading={loading}
          emptyMessage="No ended auctions"
        />
      ),
    },
  ];

  return (
    <div className="bg-black min-h-screen py-8">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-white">⚡ Auction Dashboard</h1>
            <p className="text-gray-400">
              {isConnected ? (
                <span className="text-green-400">✓ Real-time updates active</span>
              ) : (
                <span className="text-orange-400">⚠ Connecting to real-time updates...</span>
              )}
            </p>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchAuctions}
              loading={loading}
              size="large"
            >
              Refresh
            </Button>
          </Space>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabs}
          size="large"
          className="auction-tabs"
        />
      </div>
    </div>
  );
};

export default HomePage;

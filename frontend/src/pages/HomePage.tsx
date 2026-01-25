import { useState } from 'react';
import { Tabs, Button, Space, Empty, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { AuctionStatus } from '../api/types';
import { useAuctions } from '../hooks/useAuctions';
import { useWebSocket } from '../hooks/useWebSocket';
import AuctionList from '../features/auction/AuctionList';

/**
 * Home Page Component
 * 
 * Features:
 * - Tab-based filtering: LIVE, UPCOMING (SCHEDULED), ENDED
 * - Pagination support with React Query
 * - Real-time updates via WebSocket
 * - Automatic refetch when countdown reaches 00:00:00
 * 
 * Tab Logic (Backend Driven):
 * - Tab "LIVE" → calls API with status=LIVE
 * - Tab "UPCOMING" → calls API with status=SCHEDULED  
 * - Tab "ENDED" → calls API with status=ENDED
 * 
 * Page indices: Frontend uses 1-based, Backend converts via Pageable
 */
export const HomePage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('live');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Map tab keys to backend status parameters
  const statusMap: Record<string, AuctionStatus> = {
    live: AuctionStatus.LIVE,
    scheduled: AuctionStatus.SCHEDULED,
    ended: AuctionStatus.ENDED,
  };

  const currentStatus = statusMap[activeTab] || AuctionStatus.LIVE;

  // Fetch auctions with React Query
  const { data, isLoading, error, refetch } = useAuctions(
    currentStatus,
    page,
    pageSize
  );

  // Reset to page 1 when changing tabs
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
  };

  // WebSocket connection for real-time price updates
  const { isConnected } = useWebSocket({
    onPriceUpdate: () => {
      // Refetch to sync with latest data
      refetch();
    },
  });

  // Manual refresh button
  const handleRefresh = async () => {
    await refetch();
  };

  // Callback for when countdown reaches 00:00:00
  // Called from AuctionCard component
  const handleCountdownComplete = () => {
    // Invalidate the auctions query to trigger a refetch
    // This ensures UI stays in sync with backend scheduler state transitions
    queryClient.invalidateQueries({ queryKey: ['auctions'] });
  };

  // Expose refetch handler globally for countdown events
  // (Alternative approach if using ref/context)
  (window as any).handleCountdownComplete = handleCountdownComplete;

  // Tab definitions with dynamic labels
  // Only show count badge for the active tab
  const tabs = [
    {
      key: 'live',
      label: activeTab === 'live' ? `LIVE (${data?.totalElements || 0})` : 'LIVE',
      children: (
        <Spin spinning={isLoading}>
          {!isLoading && data?.data && data.data.length > 0 ? (
            <>
              <AuctionList 
                auctions={data.data} 
                onCountdownComplete={handleCountdownComplete}
              />
              {/* Pagination would go here if implementing pagination UI */}
            </>
          ) : (
            <Empty description="No live auctions" />
          )}
        </Spin>
      ),
    },
    {
      key: 'scheduled',
      label: activeTab === 'scheduled' ? `UPCOMING (${data?.totalElements || 0})` : 'UPCOMING',
      children: (
        <Spin spinning={isLoading}>
          {!isLoading && data?.data && data.data.length > 0 ? (
            <>
              <AuctionList 
                auctions={data.data}
                onCountdownComplete={handleCountdownComplete}
              />
              {/* Pagination would go here */}
            </>
          ) : (
            <Empty description="No upcoming auctions" />
          )}
        </Spin>
      ),
    },
    {
      key: 'ended',
      label: activeTab === 'ended' ? `ENDED (${data?.totalElements || 0})` : 'ENDED',
      children: (
        <Spin spinning={isLoading}>
          {!isLoading && data?.data && data.data.length > 0 ? (
            <>
              <AuctionList 
                auctions={data.data}
                onCountdownComplete={handleCountdownComplete}
              />
              {/* Pagination would go here */}
            </>
          ) : (
            <Empty description="No ended auctions" />
          )}
        </Spin>
      ),
    },
  ];

  return (
    <div className="bg-black min-h-screen py-8">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header */}
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
              onClick={handleRefresh}
              loading={isLoading}
              size="large"
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 text-red-200 rounded-lg">
            Failed to load auctions: {error.message}
          </div>
        )}

        {/* Tabs */}
        <Tabs
          activeKey={Object.keys(statusMap).find(k => statusMap[k] === currentStatus) || 'live'}
          onChange={handleTabChange}
          items={tabs}
          size="large"
          className="auction-tabs"
        />
      </div>
    </div>
  );
};

export default HomePage;

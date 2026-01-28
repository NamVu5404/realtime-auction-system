# Account Tracking - Code Snippets Reference

## API Types Definition
**File: src/api/types.ts**

```typescript
/**
 * User Tracking Response - Account tracking/audit history
 * Derived from UserTrackingResponse.java
 * Details is a flexible Map that varies by action type
 */
export interface UserTrackingResponse {
  id: number;
  actionType: string; // e.g., "FRAUD_DETECTED", "USER_BLOCKED", "USER_UNBLOCKED", "SYSTEM_UPDATE"
  details: Record<string, any>; // Flexible map from backend (fraudType, bidId, reason, by, etc.)
  createdAt: string; // ISO 8601 UTC string
}
```

---

## API Method
**File: src/api/adminApi.ts**

```typescript
// User Tracking - Fetch tracking/audit history for a user
getTrackingUser: async (
  userId: number,
  page: number = 1,
  size: number = 20
): Promise<PageResponse<UserTrackingResponse>> => {
  try {
    const response = await axiosClient.get<ApiResponse<PageResponse<UserTrackingResponse>>>(
      `/users/${userId}/tracking`,
      {
        params: {
          userId,
          page,
          size,
        },
      }
    );
    return response.data.result;
  } catch (error) {
    console.error('Failed to fetch user tracking:', error);
    throw error;
  }
},
```

---

## AccountTrackingDrawer Component
**File: src/components/admin/AccountTrackingDrawer.tsx**

### Component Props
```typescript
interface AccountTrackingDrawerProps {
  visible: boolean;
  userId: number | null;
  user: User | null;
  onClose: () => void;
  page: number;
  onPageChange: (page: number) => void;
}
```

### Main Component Structure
```typescript
export const AccountTrackingDrawer = ({
  visible,
  userId,
  user,
  onClose,
  page,
  onPageChange,
}: AccountTrackingDrawerProps) => {
  // Fetch tracking data with pagination
  const { data, isLoading } = useQuery<PageResponse<UserTrackingResponse>>({
    queryKey: ["user-tracking", userId, page],
    queryFn: () => adminApi.getTrackingUser(userId!, page, 20),
    enabled: visible && !!userId,
  });

  // Build timeline items
  const timelineItems = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return [];
    }
    return data.data.map((tracking) => (
      <TrackingItem key={tracking.id} tracking={tracking} />
    ));
  }, [data?.data]);

  return (
    <Drawer
      title={`Tracking History: ${user?.email || user?.name || "User"}`}
      placement="right"
      onClose={onClose}
      open={visible}
      width={800}
      bodyStyle={{ paddingBottom: "60px", backgroundColor: "#0a0a0a" }}
      headerStyle={{ backgroundColor: "#181818", borderBottom: "1px solid #404040" }}
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton active paragraph={{ rows: 4 }} />
          <Skeleton active paragraph={{ rows: 4 }} />
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <Empty description="No tracking history found" />
      ) : (
        <div className="space-y-6">
          <Timeline>
            {timelineItems}
          </Timeline>

          {data && data.totalElements > 20 && (
            <div className="flex justify-center mt-6 pt-4 border-t border-zinc-800">
              <Pagination
                current={page}
                pageSize={20}
                total={data.totalElements}
                onChange={onPageChange}
              />
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};
```

### Dynamic TrackingItem Component
```typescript
const TrackingItem = ({
  tracking,
}: {
  tracking: UserTrackingResponse;
}) => {
  const { actionType, details, createdAt } = tracking;

  // Format timestamp to local time
  const formattedTime = dayjs(createdAt).format("DD/MM/YYYY HH:mm:ss");

  // Determine icon and color based on action type and details
  const getIconAndColor = () => {
    if (actionType.includes("FRAUD") || details?.fraudType || details?.bidId) {
      return {
        icon: <AlertOutlined />,
        color: "red",
        label: "Fraud Alert",
      };
    }
    if (actionType.includes("BLOCK")) {
      return {
        icon: <LockOutlined />,
        color: "volcano",
        label: "User Blocked",
      };
    }
    if (actionType.includes("UNBLOCK")) {
      return {
        icon: <UnlockOutlined />,
        color: "green",
        label: "User Unblocked",
      };
    }
    return {
      icon: <CheckCircleOutlined />,
      color: "blue",
      label: actionType,
    };
  };

  const { icon, color, label } = getIconAndColor();

  // Render fraud alert card
  if (details?.fraudType || details?.bidId) {
    return (
      <Timeline.Item
        dot={<span style={{ color }}>{icon}</span>}
        label={formattedTime}
      >
        <Card
          size="small"
          className="bg-zinc-800 border-zinc-700"
          title={
            <div className="flex items-center gap-2">
              <Tag color={color}>🚨 FRAUD ALERT</Tag>
              <span className="text-white text-sm font-semibold">{label}</span>
            </div>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            {details?.fraudType && (
              <div>
                <span className="text-gray-400 text-xs">Fraud Type:</span>
                <Tag color="red" className="ml-2">
                  {details.fraudType}
                </Tag>
              </div>
            )}
            {details?.bidId && (
              <div>
                <span className="text-gray-400 text-xs">Bid ID:</span>
                <Tag className="ml-2">{details.bidId}</Tag>
              </div>
            )}
            {details?.auctionId && (
              <div>
                <span className="text-gray-400 text-xs">Auction ID:</span>
                <Tag className="ml-2">{details.auctionId}</Tag>
              </div>
            )}
            {details?.description && (
              <div>
                <span className="text-gray-400 text-xs">Description:</span>
                <p className="text-gray-300 text-sm mt-1">
                  {details.description}
                </p>
              </div>
            )}
          </Space>
        </Card>
      </Timeline.Item>
    );
  }

  // Render admin action card
  if (details?.reason || details?.by) {
    return (
      <Timeline.Item
        dot={<span style={{ color }}>{icon}</span>}
        label={formattedTime}
      >
        <Card
          size="small"
          className="bg-zinc-800 border-zinc-700"
          title={
            <div className="flex items-center gap-2">
              <Tag color={color}>{label}</Tag>
              {details?.by && (
                <span className="text-gray-400 text-xs">By: {details.by}</span>
              )}
            </div>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            {details?.reason && (
              <div>
                <span className="text-gray-400 text-xs block mb-1">Reason:</span>
                <div className="bg-zinc-700/50 rounded p-2 border border-zinc-600">
                  <p className="text-gray-200 text-sm">{details.reason}</p>
                </div>
              </div>
            )}
            {/* Render other fields as tags if present */}
            {Object.entries(details || {}).map(([key, value]) => {
              if (
                key === "reason" ||
                key === "by" ||
                key === "fraudType" ||
                key === "bidId" ||
                key === "auctionId" ||
                key === "description"
              ) {
                return null;
              }
              return (
                <div key={key}>
                  <Tooltip title={String(value)}>
                    <Tag className="cursor-help">
                      {key}: {String(value).substring(0, 30)}
                      {String(value).length > 30 ? "..." : ""}
                    </Tag>
                  </Tooltip>
                </div>
              );
            })}
          </Space>
        </Card>
      </Timeline.Item>
    );
  }

  // Fallback: render as generic key-value tags
  return (
    <Timeline.Item
      dot={<span style={{ color }}>{icon}</span>}
      label={formattedTime}
    >
      <Card
        size="small"
        className="bg-zinc-800 border-zinc-700"
        title={
          <Tag color={color}>{label}</Tag>
        }
      >
        <div className="flex flex-wrap gap-2">
          {Object.entries(details || {}).map(([key, value]) => (
            <Tooltip key={key} title={String(value)}>
              <Tag className="cursor-help">
                {key}: {String(value).substring(0, 20)}
                {String(value).length > 20 ? "..." : ""}
              </Tag>
            </Tooltip>
          ))}
        </div>
      </Card>
    </Timeline.Item>
  );
};
```

---

## AdminUserPage Integration
**File: src/pages/admin/AdminUserPage.tsx**

### State Management
```typescript
const [historyDrawer, setHistoryDrawer] = useState<{
  visible: boolean;
  type: "bid" | "violation" | "tracking";
  userId?: number;
}>({ visible: false, type: "bid" });
const [bidHistoryPage, setBidHistoryPage] = useState(1);
const [trackingPage, setTrackingPage] = useState(1);
const [selectedUser, setSelectedUser] = useState<User | null>(null);
```

### Dropdown Menu Item
```typescript
{
  key: "account-tracking",
  icon: <EyeOutlined />,
  label: "View Account Tracking",
  onClick: () => {
    setSelectedUser(record);
    setTrackingPage(1);
    setHistoryDrawer({
      visible: true,
      type: "tracking",
      userId: record.id,
    });
  },
}
```

### Drawer Instance
```typescript
<AccountTrackingDrawer
  visible={historyDrawer.visible && historyDrawer.type === "tracking"}
  userId={historyDrawer.type === "tracking" ? historyDrawer.userId || null : null}
  user={selectedUser}
  onClose={() => {
    setHistoryDrawer({ visible: false, type: "bid" });
    setSelectedUser(null);
    setTrackingPage(1);
  }}
  page={trackingPage}
  onPageChange={setTrackingPage}
/>
```

---

## Example API Response

### Fraud Detection Response
```json
{
  "id": 1,
  "actionType": "FRAUD_DETECTED",
  "createdAt": "2024-01-25T10:30:00Z",
  "details": {
    "fraudType": "MULTIPLE_ACCOUNTS",
    "bidId": 123,
    "auctionId": 456,
    "description": "User detected using multiple accounts in same auction"
  }
}
```

### User Blocked Response
```json
{
  "id": 2,
  "actionType": "USER_BLOCKED",
  "createdAt": "2024-01-24T15:20:00Z",
  "details": {
    "reason": "Suspicious bidding activity including anti-snipe violations",
    "by": "admin@system.com"
  }
}
```

### System Update Response
```json
{
  "id": 3,
  "actionType": "ACCOUNT_VERIFIED",
  "createdAt": "2024-01-23T09:00:00Z",
  "details": {
    "verificationMethod": "EMAIL",
    "verificationTime": "2024-01-23T09:00:00Z"
  }
}
```

### Full Page Response
```json
{
  "code": 1000,
  "result": {
    "totalPage": 2,
    "pageSize": 20,
    "currentPage": 1,
    "totalElements": 35,
    "data": [
      // ... tracking items
    ]
  }
}
```

---

## Color and Icon Reference

### Mapping Table
| Action Type | Icon | Color | Hex | Usage |
|-------------|------|-------|-----|-------|
| FRAUD* | 🚨 Alert | red | #d32f2f | Fraud detection |
| BLOCK* | 🔒 Lock | volcano | #fa541c | User blocked |
| UNBLOCK* | 🔓 Unlock | green | #52c41a | User unblocked |
| SYSTEM* | ✓ Check | blue | #1890ff | System actions |

*Detected from actionType or details map

---

## Styling Classes

### Dark Theme
```typescript
// Drawer body
backgroundColor: "#0a0a0a"

// Card styling
className="bg-zinc-800 border-zinc-700"

// Text styling
className="text-white"      // Headers
className="text-gray-400"   // Labels
className="text-gray-300"   // Content
className="text-gray-200"   // Emphasized content

// Boxes
className="bg-zinc-700/50 rounded p-2 border border-zinc-600"

// Pagination area
className="flex justify-center mt-6 pt-4 border-t border-zinc-800"
```

---

## Key Methods & Hooks

### useQuery Hook
```typescript
const { data, isLoading } = useQuery<PageResponse<UserTrackingResponse>>({
  queryKey: ["user-tracking", userId, page],
  queryFn: () => adminApi.getTrackingUser(userId!, page, 20),
  enabled: visible && !!userId,
});
```

### useMemo Hook
```typescript
const timelineItems = useMemo(() => {
  if (!data?.data || data.data.length === 0) {
    return [];
  }
  return data.data.map((tracking) => (
    <TrackingItem key={tracking.id} tracking={tracking} />
  ));
}, [data?.data]);
```

### dayjs Formatting
```typescript
const formattedTime = dayjs(createdAt).format("DD/MM/YYYY HH:mm:ss");
```

---

## Testing Examples

### Test 1: Render Component
```typescript
it('should render AccountTrackingDrawer when visible', () => {
  const { getByText } = render(
    <AccountTrackingDrawer
      visible={true}
      userId={1}
      user={{ id: 1, email: 'test@example.com', name: 'Test User' }}
      onClose={jest.fn()}
      page={1}
      onPageChange={jest.fn()}
    />
  );
  expect(getByText(/Tracking History:/)).toBeInTheDocument();
});
```

### Test 2: Fraud Card
```typescript
it('should render fraud card for FRAUD_DETECTED action', () => {
  const tracking: UserTrackingResponse = {
    id: 1,
    actionType: 'FRAUD_DETECTED',
    createdAt: '2024-01-25T10:30:00Z',
    details: {
      fraudType: 'MULTIPLE_ACCOUNTS',
      bidId: 123,
    }
  };
  // Render and assert fraud card visible
});
```

---

## Imports Required

```typescript
// In AccountTrackingDrawer.tsx
import {
  AlertOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Drawer,
  Empty,
  Pagination,
  Skeleton,
  Space,
  Tag,
  Timeline,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import { useMemo } from "react";
import adminApi from "../../api/adminApi";
import { PageResponse, User, UserTrackingResponse } from "../../api/types";

// In AdminUserPage.tsx
import AccountTrackingDrawer from "../../components/admin/AccountTrackingDrawer";
```

---

## Common Modifications

### Change Page Size
```typescript
// In AccountTrackingDrawer.tsx, line: adminApi.getTrackingUser(userId!, page, 20)
// Change 20 to desired size
adminApi.getTrackingUser(userId!, page, 50)  // 50 items per page
```

### Add New Action Type Color
```typescript
// In TrackingItem component, add to getIconAndColor():
if (actionType.includes("YOUR_ACTION")) {
  return {
    icon: <YourIcon />,
    color: "yourColor",
    label: "Your Label",
  };
}
```

### Change Timestamp Format
```typescript
// Change from DD/MM/YYYY HH:mm:ss to your preferred format:
const formattedTime = dayjs(createdAt).format("YYYY-MM-DD HH:mm");
```

### Adjust Drawer Width
```typescript
// In AccountTrackingDrawer.tsx:
<Drawer
  width={800}  // Change to desired width (e.g., 1000 for wider)
  // ...
/>
```

---

This file serves as a quick reference for developers working with the Account Tracking feature. Copy-paste code snippets as needed for implementation, customization, or testing.

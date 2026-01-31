import dayjs from "dayjs";

/**
 * Auction Audit Log Type
 */
export interface AuditLog {
  id: number;
  actor: string; // Admin name or "System"
  actionType: string;
  details?: string;
  timestamp: string; // ISO 8601 format
}

/**
 * Bid Log Type
 */
export interface BidLog {
  id: number;
  bidderEmail: string;
  bidderName: string;
  amount: number;
  timestamp: string; // ISO 8601 format
}

/**
 * Mock API: Get Auction Audit Logs
 * Simulates fetching audit/tracking logs for an auction
 *
 * @param auctionId - ID of the auction
 * @returns Promise resolving to array of audit logs
 */
export const getAuctionAuditLogs = (auctionId: number): Promise<AuditLog[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const logs: AuditLog[] = [
        {
          id: 1,
          actor: "System",
          actionType: "Auto-Started Auction",
          details: "Auction automatically started at scheduled time",
          timestamp: dayjs().subtract(2, "hours").toISOString(),
        },
        {
          id: 2,
          actor: "Admin John Doe",
          actionType: "Edited Description",
          details:
            "Updated auction description with additional product details",
          timestamp: dayjs().subtract(5, "hours").toISOString(),
        },
        {
          id: 3,
          actor: "Admin Jane Smith",
          actionType: "Status Changed",
          details: "Changed status from DRAFT to SCHEDULED",
          timestamp: dayjs().subtract(1, "day").toISOString(),
        },
        {
          id: 4,
          actor: "Admin John Doe",
          actionType: "Created Auction",
          details: "Initial auction creation",
          timestamp: dayjs().subtract(2, "days").toISOString(),
        },
        {
          id: 5,
          actor: "System",
          actionType: "Image Uploaded",
          details: "Product image uploaded successfully",
          timestamp: dayjs()
            .subtract(2, "days")
            .subtract(10, "minutes")
            .toISOString(),
        },
        {
          id: 6,
          actor: "Admin Jane Smith",
          actionType: "Price Adjusted",
          details: "Updated minimum step from $1,000 to $500",
          timestamp: dayjs()
            .subtract(1, "day")
            .subtract(2, "hours")
            .toISOString(),
        },
      ];

      resolve(logs);
    }, 500); // 500ms simulated latency
  });
};

/**
 * Mock API: Get Auction Bid Logs
 * Simulates fetching bid history for an auction
 *
 * @param auctionId - ID of the auction
 * @returns Promise resolving to array of bid logs (sorted newest first)
 */
export const getAuctionBidLogs = (auctionId: number): Promise<BidLog[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const logs: BidLog[] = [
        {
          id: 1,
          bidderEmail: "nguyen.van.a@gmail.com",
          bidderName: "Nguyen Van A",
          amount: 15000,
          timestamp: dayjs().subtract(2, "minutes").toISOString(),
        },
        {
          id: 2,
          bidderEmail: "tran.thi.b@yahoo.com",
          bidderName: "Tran Thi B",
          amount: 14500,
          timestamp: dayjs().subtract(5, "minutes").toISOString(),
        },
        {
          id: 3,
          bidderEmail: "le.van.c@outlook.com",
          bidderName: "Le Van C",
          amount: 14000,
          timestamp: dayjs().subtract(8, "minutes").toISOString(),
        },
        {
          id: 4,
          bidderEmail: "pham.thi.d@gmail.com",
          bidderName: "Pham Thi D",
          amount: 13500,
          timestamp: dayjs().subtract(12, "minutes").toISOString(),
        },
        {
          id: 5,
          bidderEmail: "hoang.van.e@hotmail.com",
          bidderName: "Hoang Van E",
          amount: 13000,
          timestamp: dayjs().subtract(15, "minutes").toISOString(),
        },
        {
          id: 6,
          bidderEmail: "vo.thi.f@gmail.com",
          bidderName: "Vo Thi F",
          amount: 12500,
          timestamp: dayjs().subtract(20, "minutes").toISOString(),
        },
        {
          id: 7,
          bidderEmail: "dang.van.g@yahoo.com",
          bidderName: "Dang Van G",
          amount: 12000,
          timestamp: dayjs().subtract(25, "minutes").toISOString(),
        },
        {
          id: 8,
          bidderEmail: "bui.thi.h@gmail.com",
          bidderName: "Bui Thi H",
          amount: 11500,
          timestamp: dayjs().subtract(30, "minutes").toISOString(),
        },
      ];

      resolve(logs);
    }, 500); // 500ms simulated latency
  });
};

export default {
  getAuctionAuditLogs,
  getAuctionBidLogs,
};

local key = KEYS[1]
local new_price = tonumber(ARGV[1])
local bidder_id = ARGV[2]
local now = ARGV[3]
local min_step = tonumber(ARGV[4])
local anti_sniping_threshold = tonumber(ARGV[5]) -- ví dụ 30 giây

-- 1. Lấy toàn bộ dữ liệu hiện tại bằng HGETALL
local auction_data = redis.call('HGETALL', key)
if #auction_data == 0 then return {-1, "Auction not found"} end

-- Chuyển đổi HGETALL sang Table để dễ truy vấn
local data = {}
for i = 1, #auction_data, 2 do
    data[auction_data[i]] = auction_data[i+1]
end

-- 2. Kiểm tra Trạng thái
if data['status'] ~= "LIVE" then return {-2, "Auction closed"} end

-- 3. Kiểm tra Giá (CurrentPrice + MinStep)
local current_price = tonumber(data['currentPrice'])
if new_price < (current_price + min_step) then
    return {-3, "Price too low"}
end

-- 4. Logic Anti-sniping (ví dụ đơn giản)
local end_time = tonumber(data['endTime'])
local is_extended = 0
if (end_time - tonumber(now)) < anti_sniping_threshold then
    end_time = end_time + 60 -- cộng thêm 60s
    is_extended = 1
end

-- 5. Cập nhật đồng loạt (Atomic Update)
redis.call('HMSET', key,
    'currentPrice', ARGV[1],
    'highestBidderId', bidder_id,
    'lastBidTime', now,
    'endTime', end_time,
    'version', tonumber(data['version']) + 1
)
redis.call('HINCRBY', key, 'bidCount', 1)

return {1, tostring(is_extended), tostring(end_time)}
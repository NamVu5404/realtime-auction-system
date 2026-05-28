# AuctionPro — Real-Time Auction Platform

A full-stack real-time bidding platform built for high-concurrency live auctions. Every architectural decision is optimized around one question: **who placed the highest valid bid, and what is the current price?**

**Live Demo:** [auctionpro.online](https://www.auctionpro.online)

---

## Overview

AuctionPro is a real-time auction platform supporting three roles — **Buyer**, **Seller**, and **Admin** — with live bidding powered by WebSocket, atomic bid processing via Redis Lua scripting, event streaming through Apache Kafka, and AI-assisted listing moderation.

---

## Features

### For Buyers
- **Real-time bidding** — live price updates via WebSocket (STOMP over SockJS) across all connected clients simultaneously
- **Anti-snipe protection** — auctions automatically extend when a bid lands within the configured window before end time
- **Kafka fallback** — client switches to polling `/auctions/{id}/state` every 5 seconds when Kafka pipeline is detected as down
- **Auction discovery** — browse by status (Live, Upcoming, Ended), search by keyword, filter by seller
- **Wishlist** — save auctions and receive notifications on activity
- **Participated auctions** — full history of auctions with at least one bid placed
- **Bid statistics** — personal bidding analytics
- **Live chat** — real-time chat inside active auction rooms

### For Sellers
- **Listing lifecycle** — create Draft → submit for review → AI/Admin approval → auto-scheduled → live
- **AI content moderation** — listings auto-approved or rejected based on confidence score; falls back to manual admin review when confidence is between 0.70–0.84
- **Auction management dashboard** — edit, cancel, or relist ended auctions
- **Reserve price** — set a minimum threshold; auction ends as `ENDED_NO_SALE` if not met
- **Private mode** — restrict auction access by token
- **Identity verification (eKYC)** — required for seller registration

### For Admins
- **Auction review** — manually approve or reject listings flagged by AI
- **User management** — block/unblock accounts, grant/revoke seller role
- **Seller management** — view registrations, approve or reject
- **Fraud audit** — review flagged bids with full context
- **AI review logs** — inspect confidence scores and model decisions
- **Hero slide management** — control homepage carousel content
- **Notification broadcast** — send system-wide notifications
- **Contact management** — handle inbound contact requests

---

## Auction State Machine

```
DRAFT ──submit──► PENDING_REVIEW ──approved──► SCHEDULED ──scheduler──► LIVE ──scheduler──► ENDED
   ▲                    │                            │                         │
   │               rejected                      CANCELLED               ENDED_NO_SALE
   │                    ▼                                                      │
   └────────────── REJECTED                                          seller relist (clone)
```

| Transition | Trigger |
|---|---|
| DRAFT → PENDING_REVIEW | Seller submits listing |
| PENDING_REVIEW → SCHEDULED | AI (confidence ≥ 0.85) or Admin approves |
| PENDING_REVIEW → REJECTED | AI (confidence < 0.70) or Admin rejects |
| PENDING_REVIEW → stays | AI confidence 0.70–0.84 → FALLBACK_TO_ADMIN |
| SCHEDULED → LIVE | Spring Scheduler (startTime ≤ now) |
| LIVE → ENDED | Spring Scheduler (endTime ≤ now, price ≥ reservePrice) |
| LIVE → ENDED_NO_SALE | Spring Scheduler (endTime ≤ now, price < reservePrice) |
| ENDED_NO_SALE → DRAFT | Seller relists (creates new DRAFT clone) |

---

## Architecture

```
React 19 + Vite 7 + TypeScript
        │  HTTPS / WebSocket (STOMP / SockJS)
Spring Boot 3 / Java 21 — Port 8080
    ├── Modules (Package-by-Feature)
    │     auction · bid · auth · user · ekyc
    │     notification · live_chat · seller_registration
    │     contact · file · analytics · fraud · mail · wishlist · ai · hero_slide
    ├── Infrastructure
    │     Spring Security · AOP Audit · Kafka · Redis
    └── Common
          ApiResponse · Enums · Base Entities · Global Exception Handler
```

**Data stores:**
- **MySQL 8** — durable storage for all entities
- **Redis 7** — authoritative `currentPrice` for LIVE auctions, atomic Lua scripts
- **Kafka** — bid event stream from Outbox poller to WebSocket broadcast

### Hot Path (Bid Placement)

```
POST /api/v2/auctions/{id}/bids
  → FraudDetectionService      (5 pre-checks)
  → RedisLuaService.atomicBid  (compare-and-swap, single Lua operation)
  → AuctionService.applyBid    (MySQL write + Outbox row, same transaction)
  → OutboxPoller (500ms)       → Kafka publish → WebSocket → all clients
                                               ↓ (@Async notificationExecutor)
                                        NotificationService
```

Redis is the **only** source of truth for `currentPrice` on a LIVE auction. The Lua script handles anti-snipe time extension atomically alongside the bid.

---

## Tech Stack

### Frontend

| | |
|---|---|
| Framework | React 19, Vite 7, TypeScript 5 |
| UI Library | Ant Design 6 |
| State management | Zustand 5 (auth + UI state), TanStack Query 5 (server state) |
| WebSocket | @stomp/stompjs 7, sockjs-client |
| Styling | Tailwind CSS 3, custom CSS variables |
| Auth | Google OAuth 2.0, jwt-decode |

### Backend

| | |
|---|---|
| Framework | Spring Boot 3.3, Java 21 |
| Realtime | Spring WebSocket (STOMP), Apache Kafka |
| Cache / Atomic ops | Redis 7 (Redisson + Spring Data Redis) |
| Database | MySQL 8, Spring Data JPA, HikariCP |
| Auth | Spring Security, JWT |
| File storage | Cloudflare R2 (S3-compatible) |
| Mapping | MapStruct |
| Architecture tests | ArchUnit (JUnit 5) |

---

## System Design Highlights

**Atomic bidding with Redis Lua**
The entire bid compare-and-swap — check current price, update if valid, extend end time if within the anti-snipe window — runs as a single Lua script on Redis. No distributed locks required; atomicity is guaranteed by Redis's single-threaded command execution.

**Transactional Outbox pattern**
MySQL bid write and Outbox row insertion happen in the same transaction. The Outbox poller (500ms interval, batch 100) publishes to Kafka asynchronously, fully decoupling the HTTP response from Kafka availability.

**Optimistic locking**
The `Auction` entity carries a `@Version long version` field. Concurrent bid attempts that pass Redis are reconciled at the MySQL level without full table locks.

**Module boundary enforcement**
ArchUnit tests verify at build time that cross-module calls only go through service interfaces — never directly to repositories or implementations of another module.

**Kafka resilience on the client**
A heartbeat WebSocket topic updates `isKafkaAlive` in the Zustand UI store. When `false`, `AuctionDetailPage` automatically switches from WebSocket updates to polling `/auctions/{id}/state` every 5 seconds.

**AI review pipeline**
Auction submissions trigger an async review on a dedicated `aiReviewExecutor` thread pool. Confidence ≥ 0.85 is a final decision; 0.70–0.84 routes to admin; below 0.70 auto-rejects. All decisions are persisted to `AiReviewLog` and `AuctionAudit`.

**Named async executors**
Notification work runs on `notificationExecutor`, AI review on `aiReviewExecutor` — isolated from the Kafka consumer thread to prevent consumer lag.

---

## Performance Constraints

| Resource | Limit |
|---|---|
| HikariCP connection pool | max 100 connections |
| Tomcat threads | max 500 |
| Redis connection pool | max 50 connections |
| Kafka batch size | 65536 bytes, Snappy compression |
| JWT access token TTL | 5 minutes |

---

## Project Structure

```
realtime-auction-system/
├── backend/
│   └── src/main/java/
│       ├── modules/                # Feature modules (package-by-feature)
│       │   ├── auction/
│       │   ├── bid/
│       │   ├── ai/
│       │   ├── user/
│       │   ├── notification/
│       │   ├── live_chat/
│       │   ├── wishlist/
│       │   ├── ekyc/
│       │   └── ...
│       ├── common/                 # Shared DTOs, exceptions, base entities
│       └── infrastructure/         # Security, Kafka, Redis configuration
└── frontend/
    └── src/
        ├── pages/
        │   ├── home/               # Buyer-facing pages
        │   ├── seller/             # Seller dashboard
        │   ├── admin/              # Admin panel
        │   └── account/            # User account & settings
        ├── features/               # Feature components (auction, bid, chat)
        ├── api/                    # Axios client + typed API layer
        ├── hooks/                  # Custom hooks (WebSocket, auth, debounce...)
        └── store/                  # Zustand stores (auth, UI)
```

---

## Author

**Vũ Ngọc Nam** · [GitHub](https://github.com/NamVu5404)

---

*Built with Spring Boot 3 · React 19 · Redis 7 · Apache Kafka · MySQL 8*

# Requirements Document

## Introduction

This feature adds performance optimizations to the universaltea Next.js + Supabase application to improve application speed, reduce memory usage, and minimize unnecessary database queries. The optimizations target three main areas: chat message pagination, food catalog caching, and database query optimization.

## Glossary

- **Chat_System**: The real-time messaging system between customers and store admins
- **Food_Catalog**: The system that displays available food items and categories
- **Cache_Layer**: Client-side data caching mechanism using React Query
- **Message_Pagination**: System for loading chat messages in chunks rather than all at once
- **Virtual_Scroller**: UI component that renders only visible items in long lists
- **Database_Query**: Request to Supabase database for data retrieval
- **React_Query**: Data fetching and caching library (@tanstack/react-query)
- **Polling_Interval**: Time between automatic data refresh requests

## Requirements

### Requirement 1: Implement Caching Layer for Food Catalog

**User Story:** As a user, I want the food catalog to load instantly on subsequent visits, so that I don't have to wait for the same data to be fetched repeatedly.

#### Acceptance Criteria

1. THE Cache_Layer SHALL store food catalog data in client-side cache using React Query
2. THE Cache_Layer SHALL store category data in client-side cache using React Query
3. WHEN a user visits the food catalog page, THE Food_Catalog SHALL serve data from cache if available
4. WHEN cached data is older than 5 minutes, THE Cache_Layer SHALL fetch fresh data in the background
5. WHEN cached data is unavailable, THE Food_Catalog SHALL fetch data from the database
6. THE Cache_Layer SHALL invalidate food cache when admin updates food items
7. THE Cache_Layer SHALL invalidate category cache when admin updates categories

### Requirement 2: Implement Message Pagination

**User Story:** As a user with a long chat history, I want messages to load in chunks, so that the application remains responsive and doesn't consume excessive memory.

#### Acceptance Criteria

1. WHEN a chat session loads, THE Chat_System SHALL fetch only the most recent 50 messages
2. WHEN a user scrolls to the top of the message list, THE Chat_System SHALL load the previous 50 messages
3. THE Chat_System SHALL maintain scroll position after loading previous messages
4. WHEN all messages have been loaded, THE Chat_System SHALL display a visual indicator
5. THE Chat_System SHALL apply pagination to both customer chat view and admin chat panel
6. FOR ALL paginated message loads, the total number of database queries SHALL be minimized through cursor-based pagination

### Requirement 3: Optimize Database Queries

**User Story:** As a system administrator, I want database queries to fetch only necessary fields, so that database load and network transfer are minimized.

#### Acceptance Criteria

1. WHEN fetching messages for display, THE Database_Query SHALL select only id, sender_id, sender_role, content, image_url, and created_at fields
2. WHEN fetching food items, THE Database_Query SHALL select only fields needed for display
3. WHEN fetching categories, THE Database_Query SHALL select only id, name, and sort_order fields
4. THE Database_Query SHALL use database indexes for frequently queried fields
5. WHEN multiple related queries are needed, THE Database_Query SHALL use JOIN operations instead of separate queries where appropriate

### Requirement 4: Implement Virtual Scrolling for Long Message Lists

**User Story:** As a user with hundreds of messages, I want the chat interface to remain smooth, so that scrolling doesn't lag or freeze.

#### Acceptance Criteria

1. WHEN a message list contains more than 100 messages, THE Virtual_Scroller SHALL render only visible messages plus a buffer
2. THE Virtual_Scroller SHALL maintain smooth scrolling performance with lists of 1000+ messages
3. THE Virtual_Scroller SHALL preserve message layout and spacing
4. WHEN new messages arrive, THE Virtual_Scroller SHALL append them without re-rendering the entire list
5. THE Virtual_Scroller SHALL automatically scroll to bottom when new messages arrive from the current user

### Requirement 5: Optimize Polling Intervals

**User Story:** As a system administrator, I want to reduce unnecessary polling requests, so that database load and network traffic are minimized.

#### Acceptance Criteria

1. WHEN realtime connection is active, THE Chat_System SHALL disable polling fallback
2. WHEN realtime connection fails, THE Chat_System SHALL enable polling with 30-second intervals
3. WHEN a user is inactive for 5 minutes, THE Chat_System SHALL pause polling
4. WHEN a user becomes active again, THE Chat_System SHALL resume polling immediately
5. THE Chat_System SHALL log polling status changes for monitoring

### Requirement 6: Implement Lazy Loading for Admin Chat Panel

**User Story:** As an admin viewing multiple chat sessions, I want chat panels to load only when opened, so that the admin interface remains responsive.

#### Acceptance Criteria

1. WHEN the admin chat page loads, THE Chat_System SHALL not fetch messages for any session
2. WHEN an admin opens a specific chat session, THE Chat_System SHALL fetch messages for that session only
3. WHEN an admin closes a chat session, THE Chat_System SHALL unsubscribe from realtime updates for that session
4. THE Chat_System SHALL cache recently viewed sessions for 2 minutes
5. WHEN switching between recently viewed sessions, THE Chat_System SHALL serve data from cache

### Requirement 7: Add Performance Monitoring

**User Story:** As a developer, I want to monitor performance metrics, so that I can identify and fix performance bottlenecks.

#### Acceptance Criteria

1. THE Cache_Layer SHALL track cache hit rate for food catalog queries
2. THE Cache_Layer SHALL track cache hit rate for category queries
3. THE Message_Pagination SHALL track average message load time
4. THE Virtual_Scroller SHALL track rendering performance for large lists
5. THE Chat_System SHALL track realtime connection success rate
6. THE Chat_System SHALL log performance metrics to browser console in development mode

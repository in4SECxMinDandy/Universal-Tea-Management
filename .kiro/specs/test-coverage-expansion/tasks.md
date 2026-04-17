# Implementation Plan: Test Coverage Expansion

## Overview

This implementation plan breaks down the test coverage expansion into 6 phases following the design document. Each phase builds incrementally, with testing infrastructure first, followed by unit tests, integration tests, E2E tests, and finally coverage optimization. The goal is to achieve 80%+ code coverage for critical paths while maintaining fast test execution and developer experience.

## Tasks

- [ ] 1. Phase 1: Test Infrastructure Setup
  - [ ] 1.1 Create Supabase mock factory
    - Create `src/test/mocks/supabase.ts` with mock factory functions
    - Implement `createMockSupabaseClient()` with auth, database, storage, and realtime mocks
    - Implement `createChainableMock()` for database query chains
    - Implement `createStorageMock()` for storage operations
    - Implement `createRealtimeMock()` for realtime subscriptions
    - _Requirements: 7.3, 7.4_
  
  - [ ] 1.2 Create test fixtures
    - Create `src/test/utils/fixtures.ts` with reusable test data
    - Add fixtures for users (mockUser, mockAdminUser)
    - Add fixtures for food items (mockFood)
    - Add fixtures for chat (mockChatSession, mockChatMessage)
    - Add fixtures for orders (mockOrder)
    - _Requirements: 7.3, 9.3_
  
  - [ ] 1.3 Create test helper utilities
    - Create `src/test/utils/test-helpers.ts` with helper functions
    - Implement `renderWithAuth()` for rendering with auth context
    - Implement `renderWithSupabase()` for rendering with Supabase mock
    - Implement `waitForLoadingToFinish()` for async operations
    - Implement `createMockFile()` for file upload testing
    - Implement `setupRealtimeSubscription()` for realtime testing
    - _Requirements: 7.3, 9.3_
  
  - [ ] 1.4 Configure coverage reporting
    - Update `vitest.config.ts` with coverage thresholds (80% for lines, branches, functions, statements)
    - Configure coverage reporters (text, json, html, lcov)
    - Set up per-file coverage tracking
    - Configure coverage exclusions (node_modules, test files, config files)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 2. Checkpoint - Verify test infrastructure
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Phase 2: Unit Tests for Utilities and Components
  - [ ] 3.1 Write unit tests for utility functions
    - Create `src/lib/utils.test.ts` (if not exists or expand existing)
    - Test `formatPrice()` function with various inputs
    - Test `formatTime()` function with various date formats
    - Test `cn()` className utility function
    - Test any validation functions
    - _Requirements: 1.1, 9.1, 9.2_
  
  - [ ]* 3.2 Write unit tests for FoodCard component
    - Create `src/components/food/FoodCard.test.tsx` (expand existing if present)
    - Test rendering with required props
    - Test rendering with optional props (image, featured status)
    - Test rendering when food is unavailable
    - Test click interactions
    - _Requirements: 1.1, 9.1, 9.2_
  
  - [ ]* 3.3 Write unit tests for OrderForm component
    - Create `src/components/food/OrderForm.test.tsx`
    - Test form rendering
    - Test quantity input validation
    - Test form submission with valid data
    - Test form submission with invalid data (negative quantity, zero quantity)
    - Test stock availability checks
    - _Requirements: 2.1, 2.4, 9.1, 9.2_
  
  - [ ]* 3.4 Write unit tests for RoleGate component
    - Expand `src/components/auth/RoleGate.test.tsx` (already exists)
    - Test rendering for admin users
    - Test rendering for non-admin users
    - Test loading states
    - Test with anonymous users
    - _Requirements: 4.1, 9.1, 9.2_
  
  - [ ]* 3.5 Write unit tests for AdminChatPanel component
    - Create `src/components/admin/AdminChatPanel.test.tsx`
    - Test rendering of chat sessions list
    - Test session selection
    - Test message display
    - Test message deletion UI
    - _Requirements: 4.1, 4.2, 4.3, 9.1, 9.2_
  
  - [ ]* 3.6 Write unit tests for FoodFormModal component
    - Create `src/components/admin/FoodFormModal.test.tsx`
    - Test form rendering for create mode
    - Test form rendering for edit mode
    - Test form validation
    - Test form submission
    - _Requirements: 4.1, 9.1, 9.2_
  
  - [ ]* 3.7 Write unit tests for ChatContent component
    - Expand `src/app/chat/ChatContent.test.tsx` (already exists)
    - Test message list rendering
    - Test message input
    - Test image upload button
    - Test loading states
    - Test empty state
    - _Requirements: 1.1, 1.2, 9.1, 9.2_

- [ ] 4. Checkpoint - Verify unit tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Phase 3: Integration Tests for Chat System
  - [ ] 5.1 Write integration tests for chat message creation
    - Create `src/app/chat/sendMessage.test.ts` (or similar location)
    - Test successful message creation with Supabase mock
    - Test message creation with database error
    - Test message creation with missing session_id
    - Test message creation with invalid data
    - **Validates: Requirements 1.1, 1.3, 1.5**
  
  - [ ] 5.2 Write integration tests for chat image upload
    - Create `src/app/chat/uploadImage.test.ts` (or similar location)
    - Test successful image upload to Supabase Storage
    - Test image upload with storage error
    - Test image URL generation after upload
    - Test file size validation (reject files > 5MB)
    - Test file type validation (accept only images)
    - **Validates: Requirements 1.2, 1.4, 1.6, 3.1, 3.2, 3.3, 3.4, 3.5**
  
  - [ ] 5.3 Write integration tests for chat realtime subscriptions
    - Create `src/app/chat/realtime.test.tsx`
    - Test subscription setup for chat session
    - Test receiving new messages via realtime
    - Test UI updates when new message arrives
    - Test cleanup on component unmount
    - **Validates: Requirements 1.7**
  
  - [ ] 5.4 Write integration tests for ChatContent with Supabase
    - Create `src/app/chat/ChatContent.integration.test.tsx`
    - Test loading messages from database
    - Test sending message through component
    - Test uploading image through component
    - Test error handling for failed operations
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6, 1.7**

- [ ] 6. Phase 4: Integration Tests for Order System
  - [ ] 6.1 Write integration tests for order creation
    - Create `src/lib/orders/createOrder.test.ts` (or similar location)
    - Test successful order creation with Supabase mock
    - Test order creation with database error
    - Test order creation with invalid food_id
    - Test order creation with invalid quantity
    - **Validates: Requirements 2.1, 2.2**
  
  - [ ] 6.2 Write integration tests for stock deduction
    - Create `src/lib/orders/stockDeduction.test.ts`
    - Test stock deduction when order is created
    - Test stock deduction with insufficient stock
    - Test stock deduction trigger behavior
    - Test concurrent order handling
    - **Validates: Requirements 2.3, 2.4, 2.5**
  
  - [ ] 6.3 Write integration tests for order validation
    - Create `src/lib/orders/validation.test.ts`
    - Test validation for quantity > 0
    - Test validation for quantity <= available stock
    - Test validation for valid food_id
    - Test validation for authenticated user
    - **Validates: Requirements 2.4**

- [ ] 7. Phase 5: Integration Tests for Admin Operations
  - [ ] 7.1 Write integration tests for admin message deletion
    - Create `src/components/admin/deleteMessage.test.ts`
    - Test successful message deletion
    - Test message deletion with database error
    - Test message deletion authorization (admin only)
    - Test UI update after deletion
    - **Validates: Requirements 4.3**
  
  - [ ] 7.2 Write integration tests for admin order management
    - Create `src/components/admin/orderManagement.test.ts`
    - Test loading orders list
    - Test filtering orders by status
    - Test updating order status
    - Test order details display
    - **Validates: Requirements 4.4**
  
  - [ ] 7.3 Write integration tests for admin chat session viewing
    - Create `src/components/admin/chatSessions.test.ts`
    - Test loading all chat sessions
    - Test filtering sessions by status
    - Test viewing messages for a session
    - Test realtime updates for new sessions
    - **Validates: Requirements 4.2**

- [ ] 8. Checkpoint - Verify integration tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Phase 6: E2E Tests for Critical User Flows
  - [ ] 9.1 Write E2E test for chat flow
    - Create `e2e/chat.spec.ts`
    - Test user login and navigation to chat
    - Test sending text message
    - Test uploading image in chat
    - Test receiving admin response in realtime
    - Test chat history persistence
    - **Validates: Requirements 1.7, 8.2**
  
  - [ ] 9.2 Write E2E test for order creation flow
    - Create `e2e/order.spec.ts`
    - Test user login and navigation to food page
    - Test selecting food item
    - Test filling order form with valid quantity
    - Test submitting order
    - Test verifying stock deduction after order
    - Test order failure with insufficient stock
    - **Validates: Requirements 2.6, 8.3**
  
  - [ ] 9.3 Write E2E test for admin chat management
    - Create `e2e/admin-chat.spec.ts`
    - Test admin login
    - Test viewing all chat sessions
    - Test selecting a chat session
    - Test viewing messages in session
    - Test sending admin response
    - Test deleting a message
    - **Validates: Requirements 4.5, 8.4**
  
  - [ ] 9.4 Write E2E test for admin order management
    - Create `e2e/admin-orders.spec.ts`
    - Test admin login
    - Test viewing orders list
    - Test filtering orders by status
    - Test viewing order details
    - Test updating order status
    - Test realtime order updates
    - **Validates: Requirements 4.6, 8.5**
  
  - [ ] 9.5 Configure E2E test environment
    - Update `playwright.config.ts` with test database configuration
    - Create test data cleanup utilities
    - Create test fixtures for E2E tests (test images, test data)
    - Configure test timeouts and retries
    - **Validates: Requirements 8.6, 8.7**

- [ ] 10. Phase 7: Coverage Optimization and CI Integration
  - [ ] 10.1 Analyze coverage gaps
    - Run coverage report and identify files below 80% threshold
    - Identify critical paths with missing tests
    - Prioritize gaps by business impact
    - Document coverage gaps in a report
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  
  - [ ] 10.2 Add missing tests for coverage gaps
    - Write additional unit tests for uncovered branches
    - Write additional integration tests for uncovered interactions
    - Focus on error handling paths
    - Focus on edge cases
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  
  - [ ] 10.3 Configure CI/CD pipeline
    - Create `.github/workflows/test.yml` for GitHub Actions
    - Configure unit test job with coverage reporting
    - Configure E2E test job with Playwright
    - Configure coverage upload to Codecov or similar
    - Configure build failure on test failure
    - Configure build failure on coverage drop below 80%
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**
  
  - [ ] 10.4 Document test patterns and guidelines
    - Create `docs/testing-guide.md` with test patterns
    - Document how to write unit tests
    - Document how to write integration tests
    - Document how to write E2E tests
    - Document how to run tests locally
    - Document troubleshooting common test issues
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**

- [ ] 11. Final Checkpoint - Verify complete test suite
  - Ensure all tests pass, ask the user if questions arise.
  - Verify coverage meets 80%+ threshold for critical paths
  - Verify test suite completes within 5 minutes
  - Verify CI/CD pipeline is working correctly

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at each phase
- Unit tests validate individual components and functions
- Integration tests validate interactions with Supabase
- E2E tests validate complete user flows
- The implementation follows the 6-phase approach from the design document
- TypeScript is used throughout for type safety
- Vitest is used for unit and integration tests
- Playwright is used for E2E tests

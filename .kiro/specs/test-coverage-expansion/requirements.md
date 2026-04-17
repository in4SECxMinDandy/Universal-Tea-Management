# Requirements Document

## Introduction

This document defines requirements for expanding test coverage in the universaltea Next.js + Supabase project. The goal is to achieve 80%+ code coverage for critical paths through comprehensive unit, integration, and end-to-end testing. This will improve code quality, prevent regressions, and increase confidence in deployments.

## Glossary

- **Test_Suite**: The collection of all automated tests (unit, integration, E2E) for the application
- **Chat_System**: The messaging functionality allowing users and admins to communicate
- **Order_System**: The functionality for creating orders and managing stock
- **Image_Upload_System**: The functionality for uploading and storing images in Supabase Storage
- **Admin_Operations**: Administrative functions including chat management, order management, and food management
- **API_Routes**: Next.js API endpoints that handle server-side operations
- **E2E_Tests**: End-to-end tests using Playwright that simulate real user interactions
- **Unit_Tests**: Tests that verify individual functions and components in isolation using Vitest
- **Integration_Tests**: Tests that verify interactions between components and external services
- **Code_Coverage**: The percentage of code lines, branches, and statements executed by tests
- **Critical_Path**: Core user flows and business logic that must work correctly

## Requirements

### Requirement 1: Chat System Testing

**User Story:** As a developer, I want comprehensive tests for chat functionality, so that I can prevent regressions in messaging features.

#### Acceptance Criteria

1. THE Test_Suite SHALL include unit tests for the sendMessage function
2. THE Test_Suite SHALL include unit tests for the uploadImage function in chat
3. THE Test_Suite SHALL include integration tests for chat message creation with Supabase
4. THE Test_Suite SHALL include integration tests for chat image upload to Supabase Storage
5. WHEN a chat message is sent, THE Test_Suite SHALL verify the message appears in the database
6. WHEN a chat image is uploaded, THE Test_Suite SHALL verify the image is stored and URL is returned
7. THE Test_Suite SHALL include E2E tests for the complete chat user flow (send message, upload image, view messages)

### Requirement 2: Order System Testing

**User Story:** As a developer, I want comprehensive tests for order creation and stock management, so that I can ensure orders correctly deduct stock.

#### Acceptance Criteria

1. THE Test_Suite SHALL include unit tests for order creation logic
2. THE Test_Suite SHALL include integration tests for order creation with Supabase
3. WHEN an order is created, THE Test_Suite SHALL verify stock is deducted correctly
4. WHEN an order is created with insufficient stock, THE Test_Suite SHALL verify the order fails with appropriate error
5. THE Test_Suite SHALL include integration tests for the stock deduction trigger
6. THE Test_Suite SHALL include E2E tests for the complete order flow (select food, create order, verify stock update)

### Requirement 3: Image Upload Testing

**User Story:** As a developer, I want comprehensive tests for image upload functionality, so that I can ensure images are stored correctly in Supabase Storage.

#### Acceptance Criteria

1. THE Test_Suite SHALL include unit tests for image upload validation
2. THE Test_Suite SHALL include integration tests for image upload to Supabase Storage
3. WHEN an image is uploaded, THE Test_Suite SHALL verify the image is stored with correct permissions
4. WHEN an invalid image is uploaded, THE Test_Suite SHALL verify appropriate error handling
5. THE Test_Suite SHALL include tests for image URL generation

### Requirement 4: Admin Operations Testing

**User Story:** As a developer, I want comprehensive tests for admin operations, so that I can ensure admin functionality works correctly.

#### Acceptance Criteria

1. THE Test_Suite SHALL include unit tests for AdminChatPanel component
2. THE Test_Suite SHALL include tests for admin message viewing
3. THE Test_Suite SHALL include tests for admin message deletion
4. THE Test_Suite SHALL include integration tests for admin order management
5. THE Test_Suite SHALL include E2E tests for admin chat management flow
6. THE Test_Suite SHALL include E2E tests for admin order management flow

### Requirement 5: API Routes Testing

**User Story:** As a developer, I want comprehensive tests for API routes, so that I can ensure server-side operations work correctly.

#### Acceptance Criteria

1. THE Test_Suite SHALL include integration tests for all API routes
2. WHEN an API route is called with valid data, THE Test_Suite SHALL verify correct response
3. WHEN an API route is called with invalid data, THE Test_Suite SHALL verify appropriate error response
4. THE Test_Suite SHALL include tests for API route authentication and authorization
5. THE Test_Suite SHALL include tests for API route error handling

### Requirement 6: Code Coverage Targets

**User Story:** As a developer, I want to achieve 80%+ code coverage for critical paths, so that I can have confidence in code quality.

#### Acceptance Criteria

1. THE Test_Suite SHALL achieve at least 80% line coverage for critical paths
2. THE Test_Suite SHALL achieve at least 80% branch coverage for critical paths
3. THE Test_Suite SHALL achieve at least 80% function coverage for critical paths
4. THE Test_Suite SHALL achieve at least 80% statement coverage for critical paths
5. WHEN coverage falls below 80% for critical paths, THE Test_Suite SHALL fail the build
6. THE Test_Suite SHALL generate coverage reports in HTML format
7. THE Test_Suite SHALL generate coverage reports in JSON format

### Requirement 7: Test Infrastructure

**User Story:** As a developer, I want robust test infrastructure, so that I can write and run tests efficiently.

#### Acceptance Criteria

1. THE Test_Suite SHALL use Vitest for unit and integration tests
2. THE Test_Suite SHALL use Playwright for E2E tests
3. THE Test_Suite SHALL include test setup files for common mocks and utilities
4. THE Test_Suite SHALL support watch mode for rapid development
5. THE Test_Suite SHALL support parallel test execution
6. WHEN tests are run, THE Test_Suite SHALL complete within 5 minutes
7. THE Test_Suite SHALL include clear error messages for test failures

### Requirement 8: E2E Test Coverage

**User Story:** As a developer, I want comprehensive E2E tests for critical user flows, so that I can ensure the application works end-to-end.

#### Acceptance Criteria

1. THE Test_Suite SHALL include E2E tests for the home page (already exists)
2. THE Test_Suite SHALL include E2E tests for the chat flow
3. THE Test_Suite SHALL include E2E tests for the order creation flow
4. THE Test_Suite SHALL include E2E tests for the admin chat management flow
5. THE Test_Suite SHALL include E2E tests for the admin order management flow
6. WHEN E2E tests run, THE Test_Suite SHALL use a test database
7. WHEN E2E tests complete, THE Test_Suite SHALL clean up test data

### Requirement 9: Test Maintainability

**User Story:** As a developer, I want maintainable tests, so that I can update tests easily as code changes.

#### Acceptance Criteria

1. THE Test_Suite SHALL follow consistent naming conventions
2. THE Test_Suite SHALL use descriptive test names that explain what is being tested
3. THE Test_Suite SHALL use shared test utilities for common operations
4. THE Test_Suite SHALL avoid test interdependencies
5. THE Test_Suite SHALL use proper mocking for external dependencies
6. THE Test_Suite SHALL include comments explaining complex test logic

### Requirement 10: Continuous Integration

**User Story:** As a developer, I want tests to run automatically in CI, so that I can catch issues before deployment.

#### Acceptance Criteria

1. THE Test_Suite SHALL run on every pull request
2. THE Test_Suite SHALL run on every commit to main branch
3. WHEN tests fail, THE Test_Suite SHALL prevent deployment
4. THE Test_Suite SHALL report coverage metrics to CI
5. THE Test_Suite SHALL cache dependencies for faster CI runs

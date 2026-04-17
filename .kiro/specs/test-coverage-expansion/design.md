# Design Document: Test Coverage Expansion

## Overview

This design document outlines the comprehensive testing strategy for the universaltea Next.js + Supabase project. The goal is to achieve 80%+ code coverage for critical paths through a well-structured test suite that includes unit tests, integration tests, and end-to-end tests.

### Design Goals

1. **Comprehensive Coverage**: Achieve 80%+ coverage for critical business logic
2. **Fast Feedback**: Tests should complete within 5 minutes
3. **Maintainability**: Clear patterns and conventions for easy test maintenance
4. **Reliability**: Consistent test results with proper mocking and isolation
5. **Developer Experience**: Easy to write, run, and debug tests

### Technology Stack

- **Unit/Integration Tests**: Vitest with React Testing Library
- **E2E Tests**: Playwright
- **Coverage Reporting**: Vitest Coverage (v8)
- **Mocking**: Vitest mocks for Supabase and Next.js APIs

## Architecture

### Test Organization

```
src/
├── app/
│   ├── chat/
│   │   ├── ChatContent.tsx
│   │   └── ChatContent.test.tsx
│   └── ...
├── components/
│   ├── auth/
│   │   ├── RoleGate.tsx
│   │   └── RoleGate.test.tsx
│   ├── food/
│   │   ├── FoodCard.tsx
│   │   └── FoodCard.test.tsx
│   └── ...
├── contexts/
│   ├── AuthContext.tsx
│   └── AuthContext.test.tsx
├── lib/
│   ├── utils.ts
│   ├── utils.test.ts
│   └── supabase/
│       ├── client.ts
│       └── server.ts
└── test/
    ├── setup.tsx
    ├── mocks/
    │   ├── supabase.ts
    │   └── next.ts
    └── utils/
        ├── test-helpers.ts
        └── fixtures.ts

e2e/
├── home.spec.ts
├── chat.spec.ts
├── order.spec.ts
├── admin-chat.spec.ts
└── admin-orders.spec.ts
```

### Test Layers

1. **Unit Tests**: Test individual functions and components in isolation
   - Pure functions (utils, helpers)
   - Component rendering and behavior
   - Business logic

2. **Integration Tests**: Test interactions between components and services
   - Supabase database operations
   - Supabase Storage operations
   - API routes
   - Context providers with components

3. **E2E Tests**: Test complete user flows
   - Critical user journeys
   - Admin workflows
   - Cross-page interactions

## Components and Interfaces

### Test Utilities

#### Supabase Mock Factory

```typescript
// src/test/mocks/supabase.ts

export interface MockSupabaseClient {
  auth: {
    getSession: () => Promise<{ data: { session: any } }>
    signInAnonymously: () => Promise<{ data: { user: any }, error: any }>
    signOut: () => Promise<{ error: any }>
    onAuthStateChange: (callback: Function) => { data: { subscription: { unsubscribe: Function } } }
  }
  from: (table: string) => ChainableMock
  storage: {
    from: (bucket: string) => StorageMock
  }
  channel: (name: string) => RealtimeMock
  removeChannel: (channel: any) => void
  rpc: (fn: string, params?: any) => Promise<{ data: any, error: any }>
}

export function createMockSupabaseClient(overrides?: Partial<MockSupabaseClient>): MockSupabaseClient
export function createChainableMock(data: any, error?: any): ChainableMock
export function createStorageMock(): StorageMock
export function createRealtimeMock(): RealtimeMock
```

#### Test Fixtures

```typescript
// src/test/utils/fixtures.ts

export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  is_anonymous: false
}

export const mockAdminUser = {
  id: 'admin-123',
  email: 'admin@example.com',
  is_anonymous: false
}

export const mockFood = {
  id: 'food-1',
  name: 'Trà sữa truyền thống',
  slug: 'tra-sua-truyen-thong',
  price: 25000,
  image_url: 'https://example.com/image.jpg',
  is_available: true,
  is_featured: false,
  category: {
    id: 'cat-1',
    name: 'Trà sữa',
    slug: 'tra-sua'
  }
}

export const mockChatSession = {
  id: 'session-123',
  user_id: 'user-123',
  status: 'open',
  session_type: 'account',
  guest_name: null
}

export const mockChatMessage = {
  id: 'msg-1',
  sender_id: 'user-123',
  sender_role: 'USER',
  content: 'Test message',
  image_url: null,
  created_at: new Date().toISOString()
}

export const mockOrder = {
  id: 'order-1',
  user_id: 'user-123',
  food_id: 'food-1',
  quantity: 2,
  total_price: 50000,
  status: 'pending',
  created_at: new Date().toISOString()
}
```

#### Test Helpers

```typescript
// src/test/utils/test-helpers.ts

export function renderWithAuth(
  ui: React.ReactElement,
  options?: {
    initialUser?: any
    initialAdmin?: boolean
  }
): RenderResult

export function renderWithSupabase(
  ui: React.ReactElement,
  mockClient: MockSupabaseClient
): RenderResult

export async function waitForLoadingToFinish(): Promise<void>

export function createMockFile(
  name: string,
  size: number,
  type: string
): File

export function setupRealtimeSubscription(
  channelName: string,
  callback: Function
): { trigger: Function, cleanup: Function }
```

### Component Test Patterns

#### Pattern 1: Component Rendering Tests

```typescript
describe('ComponentName', () => {
  it('renders with required props', () => {
    render(<ComponentName prop1="value" />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('renders different states correctly', () => {
    const { rerender } = render(<ComponentName state="loading" />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    
    rerender(<ComponentName state="success" />)
    expect(screen.getByText('Success')).toBeInTheDocument()
  })
})
```

#### Pattern 2: User Interaction Tests

```typescript
describe('ComponentName interactions', () => {
  it('handles button click', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<ComponentName onClick={handleClick} />)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('handles form submission', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    
    render(<FormComponent onSubmit={handleSubmit} />)
    
    await user.type(screen.getByLabelText('Name'), 'Test Name')
    await user.click(screen.getByRole('button', { name: /submit/i }))
    
    expect(handleSubmit).toHaveBeenCalledWith({ name: 'Test Name' })
  })
})
```

#### Pattern 3: Async Data Loading Tests

```typescript
describe('ComponentName data loading', () => {
  it('shows loading state initially', () => {
    mockSupabase.from.mockReturnValue(
      createChainableMock(null) // Pending promise
    )
    
    render(<ComponentName />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays data after loading', async () => {
    mockSupabase.from.mockReturnValue(
      createChainableMock([mockFood])
    )
    
    render(<ComponentName />)
    
    await waitFor(() => {
      expect(screen.getByText('Trà sữa truyền thống')).toBeInTheDocument()
    })
  })

  it('handles errors gracefully', async () => {
    mockSupabase.from.mockReturnValue(
      createChainableMock(null, { message: 'Network error' })
    )
    
    render(<ComponentName />)
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})
```

### Integration Test Patterns

#### Pattern 1: Supabase Database Operations

```typescript
describe('Chat message creation', () => {
  let mockClient: MockSupabaseClient

  beforeEach(() => {
    mockClient = createMockSupabaseClient()
  })

  it('creates message in database', async () => {
    const insertSpy = vi.fn().mockResolvedValue({
      data: mockChatMessage,
      error: null
    })
    
    mockClient.from = vi.fn((table) => {
      if (table === 'chat_messages') {
        return { insert: insertSpy }
      }
      return createChainableMock(null)
    })

    const result = await sendMessage(mockClient, {
      session_id: 'session-123',
      content: 'Test message'
    })

    expect(insertSpy).toHaveBeenCalledWith({
      session_id: 'session-123',
      sender_id: expect.any(String),
      sender_role: 'USER',
      content: 'Test message'
    })
    expect(result.error).toBeNull()
  })

  it('handles database errors', async () => {
    mockClient.from = vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })
    }))

    const result = await sendMessage(mockClient, {
      session_id: 'session-123',
      content: 'Test'
    })

    expect(result.error).toBeDefined()
  })
})
```

#### Pattern 2: Supabase Storage Operations

```typescript
describe('Image upload', () => {
  let mockClient: MockSupabaseClient

  beforeEach(() => {
    mockClient = createMockSupabaseClient()
  })

  it('uploads image to storage', async () => {
    const uploadSpy = vi.fn().mockResolvedValue({
      data: { path: 'chat-images/test.jpg' },
      error: null
    })

    mockClient.storage.from = vi.fn(() => ({
      upload: uploadSpy,
      getPublicUrl: () => ({
        data: { publicUrl: 'https://example.com/test.jpg' }
      })
    }))

    const file = createMockFile('test.jpg', 1024, 'image/jpeg')
    const result = await uploadImage(mockClient, file, 'chat-images')

    expect(uploadSpy).toHaveBeenCalledWith(
      expect.stringContaining('.jpg'),
      file,
      expect.any(Object)
    )
    expect(result.url).toBe('https://example.com/test.jpg')
  })

  it('validates file size', async () => {
    const largeFile = createMockFile('large.jpg', 10 * 1024 * 1024, 'image/jpeg')
    
    const result = await uploadImage(mockClient, largeFile, 'chat-images')
    
    expect(result.error).toMatch(/file size/i)
  })

  it('validates file type', async () => {
    const invalidFile = createMockFile('doc.pdf', 1024, 'application/pdf')
    
    const result = await uploadImage(mockClient, invalidFile, 'chat-images')
    
    expect(result.error).toMatch(/file type/i)
  })
})
```

#### Pattern 3: Realtime Subscriptions

```typescript
describe('Chat realtime updates', () => {
  let mockClient: MockSupabaseClient
  let channelCallback: Function

  beforeEach(() => {
    mockClient = createMockSupabaseClient()
    
    mockClient.channel = vi.fn((name) => ({
      on: vi.fn((event, filter, callback) => {
        channelCallback = callback
        return { subscribe: vi.fn() }
      }),
      subscribe: vi.fn()
    }))
  })

  it('subscribes to new messages', async () => {
    render(<ChatContent />, { wrapper: createSupabaseWrapper(mockClient) })

    await waitFor(() => {
      expect(mockClient.channel).toHaveBeenCalledWith('chat-session-123')
    })
  })

  it('updates UI when new message arrives', async () => {
    render(<ChatContent />, { wrapper: createSupabaseWrapper(mockClient) })

    await waitFor(() => {
      expect(mockClient.channel).toHaveBeenCalled()
    })

    // Simulate realtime event
    act(() => {
      channelCallback({
        new: {
          id: 'msg-new',
          content: 'New message',
          sender_role: 'ADMIN'
        }
      })
    })

    await waitFor(() => {
      expect(screen.getByText('New message')).toBeInTheDocument()
    })
  })
})
```

### E2E Test Patterns

#### Pattern 1: User Flow Tests

```typescript
// e2e/chat.spec.ts

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as user
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/home')
  })

  test('user can send text message', async ({ page }) => {
    await page.goto('/chat')
    
    // Wait for chat to load
    await page.waitForSelector('[data-testid="chat-messages"]')
    
    // Type and send message
    await page.fill('[placeholder*="Nhập tin nhắn"]', 'Hello from E2E test')
    await page.click('button:has-text("Gửi")')
    
    // Verify message appears
    await expect(page.locator('text=Hello from E2E test')).toBeVisible()
  })

  test('user can upload image', async ({ page }) => {
    await page.goto('/chat')
    
    // Upload image
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('e2e/fixtures/test-image.jpg')
    
    // Wait for upload to complete
    await expect(page.locator('[data-testid="uploaded-image"]')).toBeVisible()
  })

  test('user sees admin responses in realtime', async ({ page, context }) => {
    await page.goto('/chat')
    
    // Open admin panel in new page
    const adminPage = await context.newPage()
    await adminPage.goto('/adminlogin')
    await adminPage.fill('[name="email"]', 'admin@example.com')
    await adminPage.fill('[name="password"]', 'admin123')
    await adminPage.click('button[type="submit"]')
    await adminPage.goto('/admin/chat')
    
    // Admin sends message
    await adminPage.fill('[placeholder*="Nhập tin nhắn"]', 'Admin response')
    await adminPage.click('button:has-text("Gửi")')
    
    // User should see message
    await expect(page.locator('text=Admin response')).toBeVisible({ timeout: 5000 })
  })
})
```

#### Pattern 2: Order Flow Tests

```typescript
// e2e/order.spec.ts

test.describe('Order Creation Flow', () => {
  test('user can create order and stock is deducted', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Navigate to food page
    await page.goto('/thuc-pham')
    
    // Get initial stock
    const stockText = await page.locator('[data-testid="food-stock"]').first().textContent()
    const initialStock = parseInt(stockText?.match(/\d+/)?.[0] || '0')
    
    // Click on food item
    await page.click('[data-testid="food-card"]').first()
    
    // Fill order form
    await page.fill('[name="quantity"]', '2')
    await page.click('button:has-text("Đặt hàng")')
    
    // Wait for success message
    await expect(page.locator('text=Đặt hàng thành công')).toBeVisible()
    
    // Verify stock decreased
    await page.goto('/thuc-pham')
    const newStockText = await page.locator('[data-testid="food-stock"]').first().textContent()
    const newStock = parseInt(newStockText?.match(/\d+/)?.[0] || '0')
    
    expect(newStock).toBe(initialStock - 2)
  })

  test('order fails when insufficient stock', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.goto('/thuc-pham')
    await page.click('[data-testid="food-card"]').first()
    
    // Try to order more than available
    await page.fill('[name="quantity"]', '9999')
    await page.click('button:has-text("Đặt hàng")')
    
    // Should see error
    await expect(page.locator('text=Không đủ hàng')).toBeVisible()
  })
})
```

#### Pattern 3: Admin Flow Tests

```typescript
// e2e/admin-chat.spec.ts

test.describe('Admin Chat Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/adminlogin')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
  })

  test('admin can view all chat sessions', async ({ page }) => {
    await page.goto('/admin/chat')
    
    await expect(page.locator('[data-testid="chat-session"]')).toHaveCount(
      await page.locator('[data-testid="chat-session"]').count()
    )
  })

  test('admin can delete messages', async ({ page }) => {
    await page.goto('/admin/chat')
    
    // Click on a session
    await page.click('[data-testid="chat-session"]').first()
    
    // Delete a message
    const messageCount = await page.locator('[data-testid="chat-message"]').count()
    await page.click('[data-testid="delete-message"]').first()
    await page.click('button:has-text("Xác nhận")')
    
    // Verify message deleted
    await expect(page.locator('[data-testid="chat-message"]')).toHaveCount(messageCount - 1)
  })
})
```

## Data Models

### Test Data Structure

```typescript
// Test fixtures follow the same structure as production data

interface TestUser {
  id: string
  email: string
  is_anonymous: boolean
  user_metadata?: {
    full_name?: string
  }
}

interface TestChatSession {
  id: string
  user_id: string
  status: 'open' | 'closed'
  session_type: 'account' | 'qr'
  guest_name: string | null
  created_at: string
}

interface TestChatMessage {
  id: string
  session_id: string
  sender_id: string
  sender_role: 'USER' | 'ADMIN'
  content: string
  image_url: string | null
  created_at: string
}

interface TestFood {
  id: string
  name: string
  slug: string
  price: number
  image_url: string | null
  is_available: boolean
  is_featured: boolean
  stock: number
  category: {
    id: string
    name: string
    slug: string
  }
}

interface TestOrder {
  id: string
  user_id: string
  food_id: string
  quantity: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
}
```

## Error Handling

### Test Error Scenarios

1. **Network Errors**
   - Simulate network failures
   - Test retry logic
   - Verify error messages

2. **Validation Errors**
   - Invalid input data
   - Missing required fields
   - Type mismatches

3. **Authorization Errors**
   - Unauthorized access attempts
   - Expired sessions
   - Invalid permissions

4. **Database Errors**
   - Constraint violations
   - Unique key conflicts
   - Foreign key errors

### Error Testing Pattern

```typescript
describe('Error handling', () => {
  it('displays user-friendly error message', async () => {
    mockSupabase.from.mockReturnValue(
      createChainableMock(null, {
        message: 'Database connection failed',
        code: 'CONNECTION_ERROR'
      })
    )

    render(<ComponentName />)

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })

  it('logs error for debugging', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation()

    mockSupabase.from.mockReturnValue(
      createChainableMock(null, { message: 'Error' })
    )

    render(<ComponentName />)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error'),
        expect.any(Object)
      )
    })
  })

  it('allows retry after error', async () => {
    const { rerender } = render(<ComponentName />)

    // First call fails
    mockSupabase.from.mockReturnValueOnce(
      createChainableMock(null, { message: 'Error' })
    )

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })

    // Second call succeeds
    mockSupabase.from.mockReturnValueOnce(
      createChainableMock([mockFood])
    )

    await userEvent.click(screen.getByRole('button', { name: /retry/i }))

    await waitFor(() => {
      expect(screen.getByText('Trà sữa truyền thống')).toBeInTheDocument()
    })
  })
})
```

## Testing Strategy

### Unit Testing Strategy

**Scope**: Individual functions, components, and utilities

**Coverage Targets**:
- Line coverage: 80%+
- Branch coverage: 80%+
- Function coverage: 80%+

**Priority Areas**:
1. Utility functions (formatPrice, formatTime, cn)
2. Business logic functions
3. Component rendering logic
4. Form validation
5. Data transformation

**Test Execution**:
- Run on every file save (watch mode)
- Run full suite before commit
- Parallel execution for speed

### Integration Testing Strategy

**Scope**: Component interactions with Supabase and external services

**Coverage Targets**:
- Critical paths: 90%+
- Database operations: 85%+
- Storage operations: 85%+

**Priority Areas**:
1. Chat system (message creation, image upload)
2. Order system (order creation, stock management)
3. Admin operations (message deletion, order management)
4. Authentication flows
5. Realtime subscriptions

**Mocking Strategy**:
- Mock Supabase client completely
- Use factory functions for consistent mocks
- Simulate success and error scenarios
- Test edge cases (empty data, null values)

### E2E Testing Strategy

**Scope**: Complete user journeys across multiple pages

**Coverage Targets**:
- Critical user flows: 100%
- Admin workflows: 100%

**Priority Flows**:
1. User chat flow (send message, upload image, receive response)
2. Order creation flow (select food, create order, verify stock)
3. Admin chat management (view sessions, delete messages)
4. Admin order management (view orders, update status)
5. Authentication flows (login, logout, session management)

**Test Environment**:
- Use test database (separate from production)
- Clean up test data after each test
- Use fixtures for consistent test data
- Run against local development server

### Coverage Configuration

```typescript
// vitest.config.ts coverage settings

coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  exclude: [
    'node_modules/',
    'src/test/',
    '**/*.d.ts',
    '**/*.config.*',
    '.next/',
    'e2e/',
    'coverage/',
  ],
  include: [
    'src/**/*.{ts,tsx}',
  ],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
  // Per-file thresholds for critical paths
  perFile: true,
  // Fail build if thresholds not met
  thresholdAutoUpdate: false,
}
```

### Test Execution Strategy

**Local Development**:
```bash
# Watch mode for rapid feedback
npm run test:watch

# Run all tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test file
npm run test -- src/components/auth/RoleGate.test.tsx
```

**CI/CD Pipeline**:
```yaml
# .github/workflows/test.yml

name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Maintenance Guidelines

1. **Naming Conventions**:
   - Test files: `ComponentName.test.tsx` or `functionName.test.ts`
   - Test suites: `describe('ComponentName', () => {})`
   - Test cases: `it('does something specific', () => {})`

2. **Test Organization**:
   - Group related tests in describe blocks
   - Use nested describe blocks for sub-features
   - Keep tests focused and independent

3. **Mock Management**:
   - Reset mocks in `beforeEach`
   - Clean up in `afterEach`
   - Use shared mock factories
   - Document mock behavior

4. **Async Testing**:
   - Always use `waitFor` for async operations
   - Set appropriate timeouts
   - Handle loading states
   - Test error scenarios

5. **Test Data**:
   - Use fixtures for consistent data
   - Avoid hardcoded values
   - Make test data realistic
   - Clean up after tests

## Implementation Approach

### Phase 1: Test Infrastructure (Week 1)

1. Create shared test utilities
   - Supabase mock factory
   - Test fixtures
   - Helper functions

2. Enhance test setup
   - Global mocks
   - Custom render functions
   - Test data generators

3. Configure coverage reporting
   - Set thresholds
   - Configure reporters
   - Integrate with CI

### Phase 2: Unit Tests (Week 2-3)

1. Utility functions
   - formatPrice, formatTime, cn
   - Validation functions
   - Helper functions

2. Components
   - FoodCard, OrderForm
   - RoleGate, AuthGate
   - AdminChatPanel, FoodFormModal

3. Contexts
   - AuthContext (already exists)
   - Additional context providers

### Phase 3: Integration Tests (Week 3-4)

1. Chat system
   - Message creation
   - Image upload
   - Realtime updates

2. Order system
   - Order creation
   - Stock management
   - Order validation

3. Admin operations
   - Message management
   - Order management
   - User management

### Phase 4: E2E Tests (Week 4-5)

1. User flows
   - Chat flow
   - Order flow
   - Authentication flow

2. Admin flows
   - Chat management
   - Order management
   - Food management

3. Cross-feature flows
   - End-to-end user journey
   - Admin workflow

### Phase 5: Coverage Optimization (Week 5-6)

1. Identify coverage gaps
2. Add missing tests
3. Refactor for testability
4. Document test patterns
5. CI/CD integration

## Success Criteria

1. **Coverage Metrics**:
   - 80%+ line coverage for critical paths
   - 80%+ branch coverage
   - 80%+ function coverage
   - 80%+ statement coverage

2. **Test Performance**:
   - Unit tests complete in < 2 minutes
   - Integration tests complete in < 3 minutes
   - E2E tests complete in < 5 minutes
   - Total test suite < 10 minutes

3. **Test Quality**:
   - No flaky tests
   - Clear test names
   - Comprehensive error scenarios
   - Maintainable test code

4. **Developer Experience**:
   - Easy to write new tests
   - Fast feedback in watch mode
   - Clear error messages
   - Good documentation

5. **CI/CD Integration**:
   - Tests run on every PR
   - Coverage reports generated
   - Build fails on test failure
   - Build fails on coverage drop

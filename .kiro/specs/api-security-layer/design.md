# API Security Layer Bugfix Design

## Overview

This bugfix addresses critical security vulnerabilities in the universaltea application by introducing a secure API layer between client components and the Supabase database. Currently, components directly execute database operations from the browser, bypassing server-side validation, sanitization, and rate limiting. This creates attack vectors for injection attacks, spam/abuse, and malicious file uploads.

The fix implements a centralized API layer with:
- **Zod validation schemas** for all user inputs
- **Rate limiting** to prevent brute force and spam attacks
- **Server-side file validation** for image uploads
- **Consistent error handling** and security logging
- **Migration strategy** from direct DB access to API endpoints

## Glossary

- **Bug_Condition (C)**: The condition that triggers security vulnerabilities - when client-side code directly accesses Supabase database operations without server-side validation
- **Property (P)**: The desired secure behavior - all database operations must route through validated API endpoints with rate limiting
- **Preservation**: Existing functionality (real-time chat, authentication, RLS policies) that must remain unchanged by the fix
- **Direct DB Access**: Client-side code calling `supabase.from('table').insert()` or similar operations directly from browser
- **API Layer**: Server-side Next.js API routes that validate, sanitize, and rate-limit requests before database operations
- **Zod Schema**: TypeScript-first schema validation library used for runtime type checking and input sanitization
- **Rate Limiting**: Mechanism to restrict the number of requests from a client within a time window
- **RLS (Row Level Security)**: Supabase database-level security policies that remain as defense-in-depth

## Bug Details

### Bug Condition

The bug manifests when client-side components directly execute database operations without server-side validation. The application has multiple instances where `supabase.from('chat_messages').insert()`, `supabase.auth.signInWithPassword()`, and `supabase.storage.from('chat-images').upload()` are called directly from browser code, bypassing any server-side security checks.

**Formal Specification:**
```
FUNCTION isBugCondition(operation)
  INPUT: operation of type DatabaseOperation
  OUTPUT: boolean
  
  RETURN operation.executionContext == 'CLIENT_SIDE'
         AND operation.type IN ['INSERT', 'UPDATE', 'DELETE', 'UPLOAD', 'AUTH']
         AND NOT hasServerSideValidation(operation)
         AND NOT hasRateLimiting(operation)
         AND NOT hasSanitization(operation)
END FUNCTION
```

### Examples

- **Chat Message Insert (User)**: `ChatContent.tsx` line 318 executes `supabase.from('chat_messages').insert()` directly from client without server-side validation of message content, length limits, or rate limiting
- **Chat Message Insert (Admin)**: `AdminChatPanel.tsx` line 103 executes `supabase.from('chat_messages').insert()` directly from client without verifying admin permissions server-side
- **Image Upload**: `ChatContent.tsx` line 289 uploads files directly to storage with only client-side validation of file type and size, no server-side content inspection
- **Admin Login**: `adminlogin/page.tsx` line 72 calls `supabase.auth.signInWithPassword()` without rate limiting, allowing unlimited brute force attempts

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Real-time message display via Supabase realtime channels must continue to work
- Authenticated users must continue to access protected routes (/admin, /history, /chat)
- RLS policies must continue to enforce row-level security as defense-in-depth
- Anonymous users with QR codes must continue to send messages after validation
- Message timestamps and ordering must remain consistent
- Image display in chat interface must continue to work
- Admin role verification must continue to function

**Scope:**
All inputs that pass validation should produce the same functional outcome as before. The fix adds security layers but does not change the core business logic. Users sending valid messages, uploading valid images, or logging in with correct credentials should experience identical behavior.

## Hypothesized Root Cause

Based on the bug description and codebase analysis, the root causes are:

1. **Architecture Pattern**: The application uses Supabase's client-side SDK pattern, which encourages direct database access from components. While convenient for rapid development, this pattern was implemented without adding a server-side validation layer.

2. **Missing API Abstraction**: No centralized API layer exists to intercept, validate, and sanitize requests before they reach the database. Each component directly imports `createClient()` and executes operations.

3. **Over-Reliance on RLS**: The application relies solely on Supabase RLS policies for security, which is insufficient. RLS prevents unauthorized data access but doesn't validate input format, enforce rate limits, or sanitize content.

4. **Client-Side Validation Only**: File upload validation (type, size) happens only in the browser (`ChatContent.tsx` lines 276-283), which can be bypassed by malicious actors using browser dev tools or direct API calls.

## Correctness Properties

Property 1: Bug Condition - API Layer Validation

_For any_ database operation where the bug condition holds (direct client-side access without server validation), the fixed system SHALL route the request through an API endpoint that validates inputs with Zod schemas, enforces rate limits, and sanitizes data before executing the database operation.

**Validates: Requirements 2.1, 2.2, 2.4, 2.5, 2.7**

Property 2: Preservation - Functional Behavior

_For any_ valid user input that passes validation (correct message format, valid image, correct credentials), the fixed system SHALL produce exactly the same functional outcome as the original system, preserving real-time updates, authentication flows, and user experience.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6, 3.7**

## Fix Implementation

### Changes Required

The fix introduces a layered security architecture with API routes, validation schemas, and rate limiting middleware.

**1. API Route Structure**

Create the following API endpoints in `src/app/api/`:

```
src/app/api/
├── chat/
│   ├── send/route.ts          # POST - Send chat message (user or admin)
│   └── upload-image/route.ts  # POST - Upload and validate chat image
├── auth/
│   ├── login/route.ts         # POST - Admin login with rate limiting
│   └── register/route.ts      # POST - User registration with rate limiting
└── middleware/
    ├── rateLimit.ts           # Rate limiting utility
    └── validation.ts          # Zod schema validation utility
```

**2. Zod Validation Schemas**

Create `src/lib/validation/schemas.ts`:

```typescript
import { z } from 'zod'

// Chat message validation
export const chatMessageSchema = z.object({
  session_id: z.string().uuid(),
  content: z.string().min(1).max(2000).trim(),
  image_url: z.string().url().optional().nullable(),
})

// Image upload validation
export const imageUploadSchema = z.object({
  file: z.instanceof(File),
  session_id: z.string().uuid(),
})

// Login validation
export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(255),
  captchaToken: z.string().optional(),
})
```

**3. Rate Limiting Implementation**

Create `src/lib/middleware/rateLimit.ts` using an in-memory store (or Redis for production):

```typescript
import { NextRequest } from 'next/server'

interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  maxRequests: number  // Max requests per window
}

const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<{ success: boolean; remaining: number }> => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const key = `${ip}:${req.nextUrl.pathname}`
    const now = Date.now()
    
    const record = requestCounts.get(key)
    
    if (!record || now > record.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + config.windowMs })
      return { success: true, remaining: config.maxRequests - 1 }
    }
    
    if (record.count >= config.maxRequests) {
      return { success: false, remaining: 0 }
    }
    
    record.count++
    return { success: true, remaining: config.maxRequests - record.count }
  }
}
```

**4. Server-Side File Validation**

Create `src/lib/validation/fileValidation.ts`:

```typescript
import { z } from 'zod'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit' }
  }
  
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, WEBP allowed' }
  }
  
  // Verify file signature (magic bytes) to prevent MIME type spoofing
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  
  const isValidImage = 
    (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) || // JPEG
    (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) || // PNG
    (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) || // GIF
    (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) // WEBP
  
  if (!isValidImage) {
    return { valid: false, error: 'File content does not match declared type' }
  }
  
  return { valid: true }
}
```

**5. API Route Implementation - Chat Send**

Create `src/app/api/chat/send/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatMessageSchema } from '@/lib/validation/schemas'
import { rateLimit } from '@/lib/middleware/rateLimit'

const limiter = rateLimit({ windowMs: 60000, maxRequests: 20 }) // 20 messages per minute

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResult = await limiter(req)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429 }
    )
  }
  
  // Authentication
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Parse and validate request body
  const body = await req.json()
  const validation = chatMessageSchema.safeParse(body)
  
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.errors },
      { status: 400 }
    )
  }
  
  const { session_id, content, image_url } = validation.data
  
  // Verify user has access to this session
  const { data: sessionData } = await supabase
    .from('chat_sessions')
    .select('user_id')
    .eq('id', session_id)
    .single()
  
  if (!sessionData || sessionData.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Determine sender role
  const { data: isAdmin } = await supabase.rpc('has_role', {
    uid: session.user.id,
    role_name: 'STORE_ADMIN'
  })
  
  const sender_role = isAdmin ? 'STORE_ADMIN' : 'USER'
  
  // Insert message
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id,
      sender_id: session.user.id,
      sender_role,
      content,
      image_url,
    })
    .select()
    .single()
  
  if (error) {
    console.error('[API] Chat send error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
  
  return NextResponse.json({ success: true, message: data })
}
```

**6. API Route Implementation - Image Upload**

Create `src/app/api/chat/upload-image/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateImageFile } from '@/lib/validation/fileValidation'
import { rateLimit } from '@/lib/middleware/rateLimit'

const limiter = rateLimit({ windowMs: 60000, maxRequests: 5 }) // 5 uploads per minute

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResult = await limiter(req)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many upload requests. Please wait.' },
      { status: 429 }
    )
  }
  
  // Authentication
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Parse multipart form data
  const formData = await req.formData()
  const file = formData.get('file') as File
  const session_id = formData.get('session_id') as string
  
  if (!file || !session_id) {
    return NextResponse.json({ error: 'Missing file or session_id' }, { status: 400 })
  }
  
  // Server-side file validation
  const validation = await validateImageFile(file)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }
  
  // Verify user has access to this session
  const { data: sessionData } = await supabase
    .from('chat_sessions')
    .select('user_id')
    .eq('id', session_id)
    .single()
  
  if (!sessionData || sessionData.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Upload to storage
  const ext = file.name.split('.').pop()
  const fileName = `${session.user.id}/${Date.now()}.${ext}`
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('chat-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })
  
  if (uploadError || !uploadData) {
    console.error('[API] Upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
  
  const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(fileName)
  
  return NextResponse.json({ success: true, url: urlData.publicUrl })
}
```

**7. API Route Implementation - Admin Login**

Create `src/app/api/auth/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validation/schemas'
import { rateLimit } from '@/lib/middleware/rateLimit'

const limiter = rateLimit({ windowMs: 60000, maxRequests: 5 }) // 5 login attempts per minute

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResult = await limiter(req)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please wait before trying again.' },
      { status: 429 }
    )
  }
  
  // Parse and validate request body
  const body = await req.json()
  const validation = loginSchema.safeParse(body)
  
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.errors },
      { status: 400 }
    )
  }
  
  const { email, password, captchaToken } = validation.data
  
  // Authenticate
  const supabase = createClient()
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
    ...(captchaToken ? { options: { captchaToken } } : {}),
  })
  
  if (signInError) {
    console.error('[API] Login error:', signInError)
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }
  
  // Verify admin role
  const { data: hasRole } = await supabase.rpc('has_role', {
    uid: data.user.id,
    role_name: 'STORE_ADMIN'
  })
  
  if (!hasRole) {
    await supabase.auth.signOut()
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    )
  }
  
  return NextResponse.json({ success: true, user: data.user })
}
```

**8. Client-Side Migration**

Update `src/app/chat/ChatContent.tsx` to use API endpoints:

```typescript
// Replace direct insert (line 318) with API call
async function sendMessage() {
  if ((!input.trim() && !imageFile) || !session || sending) return
  
  setSending(true)
  let uploadedUrl: string | null = null
  
  if (imageFile) {
    uploadedUrl = await uploadImageViaAPI(imageFile, session.id)
    if (!uploadedUrl && imageFile) {
      setSending(false)
      return
    }
  }
  
  // Call API instead of direct insert
  const response = await fetch('/api/chat/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: session.id,
      content: input.trim() || (uploadedUrl ? '📷 Đã gửi một ảnh' : ''),
      image_url: uploadedUrl,
    }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    alert(error.error || 'Failed to send message')
    setSending(false)
    return
  }
  
  setInput('')
  clearImage()
  await fetchMessages(session.id)
  setSending(false)
}

async function uploadImageViaAPI(file: File, sessionId: string): Promise<string | null> {
  setUploadProgress(true)
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('session_id', sessionId)
  
  const response = await fetch('/api/chat/upload-image', {
    method: 'POST',
    body: formData,
  })
  
  setUploadProgress(false)
  
  if (!response.ok) {
    const error = await response.json()
    alert(error.error || 'Upload failed')
    return null
  }
  
  const data = await response.json()
  return data.url
}
```

Update `src/components/admin/AdminChatPanel.tsx` similarly.

Update `src/app/adminlogin/page.tsx` to use login API:

```typescript
// Replace direct signInWithPassword (line 72) with API call
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setLoading(true)
  setError('')
  
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      password,
      captchaToken,
    }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    setError(error.error || 'Login failed')
    setLoading(false)
    return
  }
  
  await new Promise(res => setTimeout(res, 500))
  window.location.href = '/admin'
}
```

## Testing Strategy

### Validation Approach

The testing strategy follows a three-phase approach:
1. **Exploratory Bug Condition Checking**: Demonstrate vulnerabilities in unfixed code
2. **Fix Checking**: Verify API layer blocks invalid inputs and enforces rate limits
3. **Preservation Checking**: Verify valid inputs produce identical functional outcomes

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate security vulnerabilities BEFORE implementing the fix. Confirm the root cause analysis.

**Test Plan**: Write tests that attempt to exploit the vulnerabilities by sending malicious inputs, bypassing validation, and performing brute force attacks. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **SQL Injection Attempt**: Send chat message with SQL injection payload `'; DROP TABLE chat_messages; --` (will succeed on unfixed code if RLS is misconfigured)
2. **XSS Attempt**: Send chat message with script tag `<script>alert('XSS')</script>` (will be stored on unfixed code)
3. **Oversized Message**: Send 10,000 character message (will succeed on unfixed code)
4. **Malicious File Upload**: Upload PHP file renamed to `.jpg` (will succeed on unfixed code with only client-side validation)
5. **Brute Force Login**: Attempt 100 login requests in 10 seconds (will succeed on unfixed code)
6. **Rate Limit Bypass**: Send 50 chat messages in 10 seconds (will succeed on unfixed code)

**Expected Counterexamples**:
- Malicious inputs are stored in database without sanitization
- File uploads bypass validation when client-side checks are disabled
- Unlimited requests succeed without rate limiting
- Possible causes: no server-side validation layer, no rate limiting middleware, over-reliance on client-side checks

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (malicious or invalid inputs), the fixed system rejects them with appropriate error messages.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := apiEndpoint_fixed(input)
  ASSERT result.status IN [400, 401, 403, 429]
  ASSERT result.error IS NOT NULL
  ASSERT NOT databaseContains(input)
END FOR
```

**Test Cases**:
1. **Validation Rejection**: Send invalid inputs (empty message, oversized message, malformed UUID) and verify 400 Bad Request
2. **Rate Limit Enforcement**: Send 21 messages in 1 minute and verify 429 Too Many Requests on 21st request
3. **File Validation**: Upload invalid file types (.exe, .php) and verify 400 Bad Request
4. **Authentication Check**: Send request without auth token and verify 401 Unauthorized
5. **Authorization Check**: User A attempts to send message in User B's session and verify 403 Forbidden

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (valid inputs), the fixed system produces the same functional outcome as the original system.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  result_original := directDatabaseAccess(input)
  result_fixed := apiEndpoint_fixed(input)
  ASSERT result_original.functionalOutcome == result_fixed.functionalOutcome
  ASSERT result_fixed.message.content == input.content
  ASSERT result_fixed.message.created_at IS NOT NULL
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many valid test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all valid inputs

**Test Plan**: Observe behavior on UNFIXED code first for valid operations, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Valid Message Preservation**: Send valid messages (1-2000 chars) and verify they appear in chat with correct timestamp and sender
2. **Valid Image Preservation**: Upload valid images (JPEG, PNG, GIF, WEBP under 5MB) and verify they display correctly
3. **Valid Login Preservation**: Login with correct credentials and verify successful authentication and redirect
4. **Real-time Preservation**: Send message and verify it appears via realtime subscription
5. **Anonymous User Preservation**: Anonymous user with QR code sends message and verify it succeeds after validation

### Unit Tests

- Test Zod schema validation with valid and invalid inputs
- Test rate limiting logic with various request patterns
- Test file validation with different file types and sizes
- Test API route authentication and authorization logic
- Test error response formatting

### Property-Based Tests

- Generate random valid messages (varying lengths, Unicode characters) and verify API accepts them
- Generate random valid images (different formats, sizes) and verify upload succeeds
- Generate random invalid inputs (oversized, malformed) and verify API rejects them
- Test rate limiting with random request patterns and verify limits are enforced
- Test preservation of message ordering and timestamps across many messages

### Integration Tests

- Test full chat flow: authenticate → create session → send message → verify real-time update
- Test image upload flow: authenticate → upload image → send message with image → verify display
- Test admin flow: login → verify role → send admin message → verify user receives it
- Test rate limiting across multiple users and sessions
- Test error handling and recovery (network failures, database errors)

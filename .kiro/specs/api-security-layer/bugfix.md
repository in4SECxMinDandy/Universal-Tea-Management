# Bugfix Requirements Document

## Introduction

The universaltea Next.js + Supabase application has critical security vulnerabilities stemming from direct client-side database access without proper API layer abstraction. Components directly call Supabase database operations from the browser, bypassing server-side validation, sanitization, and rate limiting. This creates multiple attack vectors including injection attacks, spam/abuse, and malicious file uploads. This bugfix introduces a secure API layer with request validation, rate limiting, and server-side file validation to protect the application from these security threats.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user sends a chat message THEN the system executes `supabase.from('chat_messages').insert()` directly from the client-side component without server-side validation

1.2 WHEN an admin sends a chat message THEN the system executes `supabase.from('chat_messages').insert()` directly from the client-side component without server-side validation

1.3 WHEN a user attempts to log in THEN the system calls `supabase.auth.signInWithPassword()` without any rate limiting, allowing unlimited login attempts

1.4 WHEN a user uploads an image in chat THEN the system uploads directly to Supabase storage from the client without server-side validation of file type, size, or content

1.5 WHEN user-provided data is inserted into the database THEN the system does not sanitize or validate the input on the server side, relying solely on client-side checks and RLS policies

1.6 WHEN authentication endpoints are accessed THEN the system does not enforce rate limits, making it vulnerable to brute force attacks and spam

1.7 WHEN database operations are performed THEN the system bypasses a centralized API layer, making it difficult to implement consistent security policies, logging, and monitoring

### Expected Behavior (Correct)

2.1 WHEN a user sends a chat message THEN the system SHALL route the request through an API endpoint (`/api/chat/send`) that validates the message content with Zod schemas before inserting into the database

2.2 WHEN an admin sends a chat message THEN the system SHALL route the request through an API endpoint (`/api/chat/send`) that validates the message content and verifies admin permissions before inserting into the database

2.3 WHEN a user attempts to log in THEN the system SHALL enforce rate limiting (maximum 5 login attempts per minute per IP address) to prevent brute force attacks

2.4 WHEN a user uploads an image in chat THEN the system SHALL validate the file server-side through an API endpoint, checking file type (JPEG, PNG, GIF, WEBP only), size (max 5MB), and content before allowing upload to storage

2.5 WHEN user-provided data is submitted THEN the system SHALL validate and sanitize all inputs using Zod schemas on the server side before any database operations

2.6 WHEN authentication endpoints are accessed THEN the system SHALL enforce rate limits to prevent abuse (e.g., max 5 requests per minute for login, max 3 requests per minute for registration)

2.7 WHEN database operations are performed THEN the system SHALL route all operations through a centralized API layer that provides consistent validation, error handling, logging, and security policies

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user successfully sends a valid chat message THEN the system SHALL CONTINUE TO display the message in real-time to both user and admin

3.2 WHEN an admin successfully sends a valid chat message THEN the system SHALL CONTINUE TO display the message in real-time to the user

3.3 WHEN a user successfully logs in with valid credentials THEN the system SHALL CONTINUE TO authenticate the user and redirect to the appropriate page

3.4 WHEN a user uploads a valid image (correct type and size) THEN the system SHALL CONTINUE TO store the image and display it in the chat interface

3.5 WHEN Supabase RLS policies are in place THEN the system SHALL CONTINUE TO enforce row-level security as an additional defense layer

3.6 WHEN real-time subscriptions are active THEN the system SHALL CONTINUE TO receive and display new messages via Supabase real-time channels

3.7 WHEN anonymous users access the chat via QR code THEN the system SHALL CONTINUE TO allow them to send messages after proper validation

3.8 WHEN the middleware checks authentication THEN the system SHALL CONTINUE TO protect routes requiring authentication (/admin, /history, /chat)

# Admin Login with MFA (Multi-Factor Authentication)

## Overview
Complete admin authentication system with email/password login and email-based OTP verification for enhanced security.

## Features Implemented

### 1. **Two-Step Authentication**
- ✅ **Step 1**: Email & Password verification
- ✅ **Step 2**: 6-digit OTP sent to email

### 2. **Login Flow**
```
1. Admin enters email & password
2. System verifies credentials
3. System generates 6-digit OTP
4. OTP sent to admin's email
5. Admin enters OTP
6. System verifies OTP
7. Admin logged in successfully
```

### 3. **Security Features**
- ✅ **OTP Expiration**: 10 minutes validity
- ✅ **One-time Use**: OTP deleted after verification
- ✅ **Resend Cooldown**: 60-second wait between resends
- ✅ **Session Tokens**: Temporary session for OTP verification
- ✅ **Input Validation**: 6-digit numeric OTP only

### 4. **User Experience**
- ✅ **Visual Feedback**: Different icons for login vs MFA
- ✅ **Email Masking**: Shows email in verification screen
- ✅ **Resend Option**: Can request new OTP if not received
- ✅ **Back Button**: Can return to login if needed
- ✅ **Timer Display**: Shows countdown for resend cooldown
- ✅ **Large OTP Input**: Easy-to-read centered input field

## File Structure

```
/app
  /login/page.tsx                          # Login page wrapper
  /api/auth
    /login/route.ts                        # Step 1: Verify credentials, send OTP
    /verify-mfa/route.ts                   # Step 2: Verify OTP, complete login
    /resend-otp/route.ts                   # Resend OTP endpoint

/src
  /types/admin.ts                          # MFAVerification interface
  /schemas/admin.ts                        # mfaVerificationSchema
  /components/auth
    /LoginForm.tsx                         # Complete login + MFA UI
```

## API Endpoints

### 1. POST `/api/auth/login`
**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "requireMFA": true,
  "sessionToken": "session-1234567890-abc123",
  "message": "OTP sent to your email"
}
```

**Response (Error):**
```json
{
  "message": "Invalid email or password"
}
```

### 2. POST `/api/auth/verify-mfa`
**Request:**
```json
{
  "email": "admin@example.com",
  "otp": "123456",
  "sessionToken": "session-1234567890-abc123"
}
```

**Response (Success):**
```json
{
  "token": "jwt-token-1234567890",
  "admin": {
    "id": "1",
    "email": "admin@example.com",
    "name": "Admin Name",
    "role": { ... }
  }
}
```

**Response (Error):**
```json
{
  "message": "Invalid OTP"
}
```

### 3. POST `/api/auth/resend-otp`
**Request:**
```json
{
  "email": "admin@example.com",
  "sessionToken": "session-1234567890-abc123"
}
```

**Response:**
```json
{
  "message": "OTP resent successfully"
}
```

## UI Components

### Login Screen
- Email input field
- Password input field with show/hide toggle
- "Forgot password?" link
- "Sign In" button
- Yellow branding with CloudLightning icon

### MFA Verification Screen
- Shield icon (security indicator)
- Email display (masked)
- Large centered OTP input (6 digits)
- "Verify Code" button
- "Resend Code" button with timer
- "Back to Login" button
- Info alert about email sent

## Data Models

### MFAVerification Interface
```typescript
export interface MFAVerification {
  email: string;
  otp: string;
  sessionToken: string;
}
```

### Validation Schema
```typescript
export const mfaVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
  sessionToken: z.string().min(1, "Session token is required"),
});
```

## Security Considerations

### Current Implementation (Development)
- ✅ OTP stored in memory (Map)
- ✅ OTP logged to console for testing
- ✅ 10-minute expiration
- ✅ One-time use
- ✅ Session token validation

### Production Requirements
- [ ] **Use Redis** for OTP storage (distributed, persistent)
- [ ] **Send actual emails** via SendGrid/AWS SES/Nodemailer
- [ ] **Rate limiting** on login attempts (prevent brute force)
- [ ] **Rate limiting** on OTP resend (prevent spam)
- [ ] **IP tracking** for suspicious activity
- [ ] **Account lockout** after failed attempts
- [ ] **Audit logging** for all auth events
- [ ] **HTTPS only** in production
- [ ] **Secure session tokens** (cryptographically random)
- [ ] **JWT with expiration** and refresh tokens

## Email Template

### OTP Email (To Implement)
```
Subject: Your IITian Squad Admin Login Code

Hi [Admin Name],

Your verification code is: 123456

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email or contact support.

Best regards,
IITian Squad Team
```

## Testing

### Test Credentials
- **Email**: `super@iitian-squad.com`
- **Password**: `password123`

### Test Flow
1. Visit `/login`
2. Enter test credentials
3. Click "Sign In"
4. Check console for OTP (development mode)
5. Enter OTP in verification screen
6. Should redirect to dashboard

### Manual Testing Scenarios
- ✅ Valid credentials → OTP sent
- ✅ Invalid credentials → Error message
- ✅ Valid OTP → Login successful
- ✅ Invalid OTP → Error message
- ✅ Expired OTP → Error message
- ✅ Resend OTP → New OTP generated
- ✅ Resend cooldown → Button disabled
- ✅ Back to login → Returns to login screen

## Backend Integration TODO

### 1. Database Schema
```sql
-- OTP table (or use Redis)
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id),
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  used BOOLEAN DEFAULT false
);

-- Login attempts tracking
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  success BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add index for cleanup
CREATE INDEX idx_otp_expires_at ON otp_codes(expires_at);
```

### 2. Email Service Setup

#### Using Nodemailer (SMTP)
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOTP(email: string, otp: string, name: string) {
  await transporter.sendMail({
    from: '"IITian Squad" <noreply@iitian-squad.com>',
    to: email,
    subject: 'Your Login Verification Code',
    html: `
      <h2>Hi ${name},</h2>
      <p>Your verification code is: <strong style="font-size: 24px;">${otp}</strong></p>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    `,
  });
}
```

#### Using SendGrid
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

async function sendOTP(email: string, otp: string, name: string) {
  await sgMail.send({
    to: email,
    from: 'noreply@iitian-squad.com',
    subject: 'Your Login Verification Code',
    html: `
      <h2>Hi ${name},</h2>
      <p>Your verification code is: <strong style="font-size: 24px;">${otp}</strong></p>
      <p>This code will expire in 10 minutes.</p>
    `,
  });
}
```

### 3. Redis Setup (Recommended for Production)
```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Store OTP
async function storeOTP(sessionToken: string, data: any) {
  await redis.setex(
    `otp:${sessionToken}`,
    600, // 10 minutes
    JSON.stringify(data)
  );
}

// Get OTP
async function getOTP(sessionToken: string) {
  const data = await redis.get(`otp:${sessionToken}`);
  return data ? JSON.parse(data) : null;
}

// Delete OTP
async function deleteOTP(sessionToken: string) {
  await redis.del(`otp:${sessionToken}`);
}
```

### 4. Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

// Login endpoint rate limit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
});

// OTP resend rate limit
const resendLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 resend per minute
  message: 'Please wait before requesting another code',
});
```

## Environment Variables

```env
# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Or SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key

# Redis (Production)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# App
NEXT_PUBLIC_APP_URL=https://admin.iitian-squad.com
```

## Production Checklist

- [ ] Replace in-memory OTP storage with Redis
- [ ] Implement actual email sending
- [ ] Add rate limiting on all auth endpoints
- [ ] Implement account lockout after failed attempts
- [ ] Add IP tracking and suspicious activity detection
- [ ] Set up audit logging for all auth events
- [ ] Use cryptographically secure random for session tokens
- [ ] Implement JWT with proper expiration
- [ ] Add refresh token mechanism
- [ ] Set up monitoring and alerts
- [ ] Test email deliverability
- [ ] Configure SPF, DKIM, DMARC for email domain
- [ ] Add CAPTCHA for repeated failed attempts
- [ ] Implement "Remember this device" option
- [ ] Add email notification for new login from unknown device

## Advantages of Email-Based MFA

1. **No Additional App Required**: Unlike authenticator apps
2. **Accessible**: Works on any device with email access
3. **Familiar**: Users understand email verification
4. **Secure**: Time-limited, one-time use codes
5. **Audit Trail**: Email records provide proof of access attempts

## Future Enhancements

- [ ] SMS-based OTP as alternative
- [ ] Authenticator app support (TOTP)
- [ ] Backup codes for account recovery
- [ ] Trusted devices (skip MFA for 30 days)
- [ ] Biometric authentication
- [ ] WebAuthn/FIDO2 support
- [ ] Admin preference to enable/disable MFA
- [ ] MFA enforcement at role level

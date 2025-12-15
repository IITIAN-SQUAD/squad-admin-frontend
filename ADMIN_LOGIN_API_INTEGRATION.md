# Admin Login API Integration - Complete

## ✅ What Was Done

### 1. Created API Client Service
**File:** `src/services/api-client.ts`

- Generic HTTP client for all backend API calls
- Automatic token injection from localStorage
- Error handling and response parsing
- Base URL from environment variable: `NEXT_PUBLIC_API_BASE_URL`

### 2. Created Auth Service
**File:** `src/services/auth.service.ts`

- `requestOtp(email)` - Request OTP for admin login
- `verifyOtp({ email, otp })` - Verify OTP and complete login
- `verifyToken()` - Verify existing JWT token
- `logout()` - Logout admin

### 3. Updated Login Form
**File:** `src/components/auth/LoginForm.tsx`

**Changes:**
- Integrated `authService.requestOtp()` on email/password submit
- Integrated `authService.verifyOtp()` on OTP submit
- Real error handling from backend
- Resend OTP functionality

### 4. Created Documentation
**Files:**
- `API_INTEGRATION.md` - Complete API integration guide
- `ADMIN_LOGIN_API_INTEGRATION.md` - This summary

---

## 🔄 Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN LOGIN FLOW                        │
└─────────────────────────────────────────────────────────────┘

1. Admin opens /login page
   ↓
2. Admin enters email and password
   ↓
3. Click "Sign In" button
   ↓
4. Frontend → POST /v1/auth/user/request-otp/{email}
   ↓
5. Backend validates credentials and sends OTP to email
   ↓
6. Frontend shows OTP input screen
   ↓
7. Admin enters 6-digit OTP from email
   ↓
8. Click "Verify Code" button
   ↓
9. Frontend → POST /v1/auth/user/verify-otp
   Body: { email, otp }
   ↓
10. Backend validates OTP and returns JWT + admin data
   ↓
11. Frontend stores token in localStorage and cookie
   ↓
12. Redirect to dashboard (/)
```

---

## 📡 API Endpoints Required

### 1. Request OTP
```
POST /v1/auth/user/request-otp/{email}
```

**What frontend sends:**
- Path parameter: `email` (e.g., "admin@example.com")

**What backend should return:**
```json
{
  "message": "OTP sent to email."
}
```

**What backend should do:**
1. Validate email exists in database
2. Validate password (if checking credentials)
3. Generate 6-digit OTP
4. Store OTP with 5-10 min expiry
5. Send OTP via email
6. Return success message

---

### 2. Verify OTP
```
POST /v1/auth/user/verify-otp
```

**What frontend sends:**
```json
{
  "email": "admin@example.com",
  "otp": "123456"
}
```

**What backend should return:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "674a8d001c9d440000a1b0a1",
    "name": "John Doe",
    "email": "admin@example.com",
    "role": {
      "id": "role_123",
      "name": "Super Admin",
      "type": "super_admin",
      "permissions": ["manage_admins", "manage_content", "manage_exams"]
    }
  }
}
```

**What backend should do:**
1. Validate OTP exists and not expired
2. Validate OTP matches
3. Generate JWT token
4. Return token + admin user data
5. Clear OTP from storage

---

## 🔧 Configuration

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### Backend (application.properties)
```properties
# CORS configuration
cors.allowed-origins=http://localhost:3000
cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
cors.allowed-headers=*

# JWT configuration
jwt.secret=your-secret-key-here
jwt.expiration=604800000  # 7 days in milliseconds

# Email configuration (for OTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

---

## 🧪 Testing

### Test Request OTP
```bash
curl -X POST http://localhost:8080/v1/auth/user/request-otp/admin@example.com
```

**Expected Response:**
```json
{
  "message": "OTP sent to email."
}
```

### Test Verify OTP
```bash
curl -X POST http://localhost:8080/v1/auth/user/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "otp": "123456"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "674a8d001c9d440000a1b0a1",
    "name": "John Doe",
    "email": "admin@example.com",
    "role": {
      "id": "role_123",
      "name": "Super Admin",
      "type": "super_admin",
      "permissions": ["manage_admins", "manage_content"]
    }
  }
}
```

---

## 📝 Backend Implementation Checklist

### Required Java Classes

- [ ] `UserAuthController.java` - Already exists with `requestOtp()` endpoint
- [ ] `VerifyOtpRequest.java` - DTO for verify OTP request
- [ ] `LoginResponse.java` - DTO for login response
- [ ] `AdminDto.java` - DTO for admin user data
- [ ] `RoleDto.java` - DTO for role data
- [ ] `OtpService.java` - Generate and validate OTPs
- [ ] `EmailService.java` - Send OTP emails
- [ ] `JwtService.java` - Generate and validate JWT tokens

### Required Database Tables

- [ ] `admins` - Admin user data
- [ ] `roles` - Role definitions
- [ ] `permissions` - Permission definitions
- [ ] `role_permissions` - Role-permission mapping
- [ ] `otp_tokens` - Temporary OTP storage

---

## 🎯 What Frontend Expects

### On Successful OTP Request
```typescript
// Frontend expects this response
{
  message: "OTP sent to email."
}
```

### On Successful OTP Verification
```typescript
// Frontend expects this response
{
  token: "jwt_token_here",
  admin: {
    id: "string",
    name: "string",
    email: "string",
    role: {
      id: "string",
      name: "string",
      type: "super_admin" | "admin" | "content_editor" | "viewer",
      permissions: ["string", "string", ...]
    }
  }
}
```

### On Error
```typescript
// Frontend expects error in this format
{
  message: "Error message here",
  error: "Error details"
}
```

---

## 🚀 How to Run

### 1. Start Backend
```bash
cd your-backend-project
./mvnw spring-boot:run
```

### 2. Start Frontend
```bash
cd squad-admin-frontend
npm run dev
```

### 3. Test Login
1. Open http://localhost:3000/login
2. Enter admin email and password
3. Click "Sign In"
4. Check email for OTP
5. Enter OTP
6. Should redirect to dashboard

---

## 🐛 Troubleshooting

### "Failed to send OTP"
- ✅ Check if backend is running on port 8080
- ✅ Check `.env.local` has correct `NEXT_PUBLIC_API_BASE_URL`
- ✅ Check backend logs for errors
- ✅ Verify email exists in database

### "Invalid OTP"
- ✅ Check if OTP is correct
- ✅ Check if OTP has expired (5-10 min)
- ✅ Check backend OTP validation logic

### "Network Error"
- ✅ Check if backend is reachable
- ✅ Check CORS configuration on backend
- ✅ Check browser console for errors

### OTP Email Not Received
- ✅ Check spam folder
- ✅ Check backend email configuration
- ✅ Check backend logs for email sending errors
- ✅ Verify SMTP credentials

---

## 📦 Files Created/Modified

### Created:
- ✅ `src/services/api-client.ts`
- ✅ `src/services/auth.service.ts`
- ✅ `API_INTEGRATION.md`
- ✅ `ADMIN_LOGIN_API_INTEGRATION.md`

### Modified:
- ✅ `src/components/auth/LoginForm.tsx`

### Environment:
- ✅ `.env.local` (add `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`)

---

## ✨ Next Steps

1. **Backend Implementation:**
   - Implement `POST /v1/auth/user/verify-otp` endpoint
   - Add OTP generation and email sending
   - Add JWT token generation
   - Add admin user retrieval

2. **Testing:**
   - Test with real backend
   - Test OTP expiry
   - Test invalid OTP
   - Test resend OTP

3. **Security:**
   - Add rate limiting for OTP requests
   - Add HTTPS in production
   - Add CORS configuration
   - Add input validation

4. **Future Enhancements:**
   - Add "Remember me" functionality
   - Add session management
   - Add logout endpoint
   - Add token refresh

---

## 📞 Support

If you encounter issues:
1. Check this document
2. Check `API_INTEGRATION.md` for detailed guide
3. Check backend logs
4. Check browser console
5. Test API endpoints with Postman/cURL

**Happy Coding! 🎉**

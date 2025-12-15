# API Integration Guide

## Backend Configuration

### Environment Variables

Add to your `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

## Admin Login Flow (OTP-Based)

### Flow Overview

```
1. Admin enters email and password
   ↓
2. Frontend calls: POST /v1/auth/user/request-otp/{email}
   ↓
3. Backend validates credentials and sends OTP to email
   ↓
4. Admin enters 6-digit OTP
   ↓
5. Frontend calls: POST /v1/auth/user/verify-otp
   ↓
6. Backend validates OTP and returns JWT token + admin data
   ↓
7. Frontend stores token and redirects to dashboard
```

### API Endpoints

#### 1. Request OTP
```
POST /v1/auth/user/request-otp/{email}
```

**Request:**
- Path Parameter: `email` (string)
- No request body needed

**Response:**
```json
{
  "message": "OTP sent to email."
}
```

**Status Codes:**
- `200 OK` - OTP sent successfully
- `400 Bad Request` - Invalid email
- `401 Unauthorized` - Invalid credentials
- `404 Not Found` - Email not found

---

#### 2. Verify OTP
```
POST /v1/auth/user/verify-otp
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "otp": "123456"
}
```

**Response:**
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
      "permissions": [
        "manage_admins",
        "manage_content",
        "manage_exams",
        "view_analytics"
      ]
    }
  }
}
```

**Status Codes:**
- `200 OK` - OTP verified, login successful
- `400 Bad Request` - Invalid OTP format
- `401 Unauthorized` - Invalid or expired OTP
- `404 Not Found` - Email not found

---

## Frontend Implementation

### Service Layer

**File:** `src/services/auth.service.ts`

```typescript
import authService from '@/src/services/auth.service';

// Request OTP
await authService.requestOtp('admin@example.com');

// Verify OTP
const result = await authService.verifyOtp({
  email: 'admin@example.com',
  otp: '123456'
});

// Access token and admin data
console.log(result.token);
console.log(result.admin);
```

### Login Component

**File:** `src/components/auth/LoginForm.tsx`

The login form has been updated to:
1. Collect email and password
2. Call `authService.requestOtp(email)` on submit
3. Show OTP input screen
4. Call `authService.verifyOtp({ email, otp })` on OTP submit
5. Store token and admin data in localStorage
6. Redirect to dashboard

### Storage

After successful login:
- **localStorage:**
  - `auth_token` - JWT token
  - `admin` - Admin user data (JSON string)
- **Cookie:**
  - `auth_token` - JWT token (for middleware)

---

## Backend Requirements

### Expected Backend Behavior

#### Request OTP Endpoint
```java
@PostMapping("/request-otp/{email}")
@ResponseStatus(HttpStatus.OK)
public ResponseEntity<String> requestOtp(@PathVariable("email") String email) {
    // 1. Validate email format
    // 2. Check if admin exists with this email
    // 3. Validate password (if provided in request body)
    // 4. Generate 6-digit OTP
    // 5. Store OTP with expiry (5-10 minutes)
    // 6. Send OTP via email
    // 7. Return success message
    
    return ResponseEntity.ok("OTP sent to email.");
}
```

#### Verify OTP Endpoint
```java
@PostMapping("/verify-otp")
@ResponseStatus(HttpStatus.OK)
public ResponseEntity<LoginResponse> verifyOtp(@RequestBody VerifyOtpRequest request) {
    // 1. Validate email and OTP format
    // 2. Check if OTP exists and not expired
    // 3. Validate OTP matches
    // 4. Generate JWT token
    // 5. Return token + admin data
    
    LoginResponse response = new LoginResponse();
    response.setToken("jwt_token_here");
    response.setAdmin(adminData);
    
    return ResponseEntity.ok(response);
}
```

### Request/Response Models

```java
// VerifyOtpRequest.java
public class VerifyOtpRequest {
    @NotBlank
    @Email
    private String email;
    
    @NotBlank
    @Size(min = 6, max = 6)
    private String otp;
    
    // getters and setters
}

// LoginResponse.java
public class LoginResponse {
    private String token;
    private AdminDto admin;
    
    // getters and setters
}

// AdminDto.java
public class AdminDto {
    private String id;
    private String name;
    private String email;
    private RoleDto role;
    
    // getters and setters
}

// RoleDto.java
public class RoleDto {
    private String id;
    private String name;
    private String type; // "super_admin", "admin", "content_editor", "viewer"
    private List<String> permissions;
    
    // getters and setters
}
```

---

## Testing

### Manual Testing

1. **Start backend server:**
   ```bash
   # Make sure your Spring Boot app is running on port 8080
   ```

2. **Update .env.local:**
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
   ```

3. **Start frontend:**
   ```bash
   npm run dev
   ```

4. **Test login flow:**
   - Navigate to `/login`
   - Enter admin email and password
   - Click "Sign In"
   - Check email for OTP
   - Enter OTP
   - Should redirect to dashboard

### API Testing (Postman/cURL)

**Request OTP:**
```bash
curl -X POST http://localhost:8080/v1/auth/user/request-otp/admin@example.com
```

**Verify OTP:**
```bash
curl -X POST http://localhost:8080/v1/auth/user/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "otp": "123456"
  }'
```

---

## Error Handling

### Frontend Error Display

Errors are displayed in the UI using Alert components:

```typescript
try {
  await authService.requestOtp(email);
} catch (error) {
  setError(error.message); // Displayed in red alert box
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Failed to send OTP" | Backend not running | Start backend server |
| "Invalid email address" | Email format wrong | Check email format |
| "Invalid OTP" | Wrong OTP entered | Re-enter correct OTP |
| "OTP expired" | OTP timeout | Request new OTP |
| "Network error" | Backend unreachable | Check backend URL |

---

## Security Considerations

1. **OTP Expiry:** Backend should expire OTPs after 5-10 minutes
2. **Rate Limiting:** Limit OTP requests per email (e.g., 3 per hour)
3. **Token Expiry:** JWT tokens should have reasonable expiry (7 days)
4. **HTTPS:** Use HTTPS in production
5. **CORS:** Configure CORS on backend to allow frontend origin
6. **Password:** Password should be validated before sending OTP

---

## Next Steps

1. ✅ API client created (`src/services/api-client.ts`)
2. ✅ Auth service created (`src/services/auth.service.ts`)
3. ✅ Login form updated to use real API
4. ⏳ Backend endpoints need to be implemented
5. ⏳ Email service for OTP delivery
6. ⏳ JWT token generation and validation
7. ⏳ Admin user management

---

## Support

For issues or questions:
1. Check backend logs for errors
2. Check browser console for frontend errors
3. Verify `.env.local` configuration
4. Test API endpoints directly with Postman

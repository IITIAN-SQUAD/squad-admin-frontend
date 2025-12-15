# Backend API Contract for Admin Login

## Overview
This document defines the exact API contract between frontend and backend for admin login with OTP.

---

## Endpoint 1: Request OTP

### Request
```
POST /v1/auth/user/request-otp/{email}
```

**Path Parameters:**
- `email` (string, required) - Admin email address

**Request Body:** None

**Headers:**
```
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "OTP sent to email."
}
```

Or simply return plain text:
```
OTP sent to email.
```

### Error Responses

**400 Bad Request** - Invalid email format
```json
{
  "message": "Invalid email format",
  "error": "BAD_REQUEST"
}
```

**404 Not Found** - Email not found
```json
{
  "message": "Admin not found with this email",
  "error": "NOT_FOUND"
}
```

**429 Too Many Requests** - Rate limit exceeded
```json
{
  "message": "Too many OTP requests. Please try again later.",
  "error": "RATE_LIMIT_EXCEEDED"
}
```

**500 Internal Server Error** - Email sending failed
```json
{
  "message": "Failed to send OTP email",
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## Endpoint 2: Verify OTP

### Request
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

**Field Validation:**
- `email` - Valid email format, required
- `otp` - Exactly 6 digits, required

**Headers:**
```
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NzRhOGQwMDFjOWQ0NDAwMDBhMWIwYTEiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwiaWF0IjoxNzMzNTk4MDAwLCJleHAiOjE3MzQyMDI4MDB9.signature",
  "admin": {
    "id": "674a8d001c9d440000a1b0a1",
    "name": "John Doe",
    "email": "admin@example.com",
    "role": {
      "id": "role_super_admin_001",
      "name": "Super Admin",
      "type": "super_admin",
      "permissions": [
        "manage_admins",
        "manage_roles",
        "manage_content",
        "manage_exams",
        "manage_papers",
        "manage_questions",
        "view_analytics",
        "manage_settings"
      ]
    }
  }
}
```

**Response Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `token` | string | JWT token for authentication (expires in 7 days) |
| `admin.id` | string | Unique admin user ID |
| `admin.name` | string | Full name of admin |
| `admin.email` | string | Email address |
| `admin.role.id` | string | Role ID |
| `admin.role.name` | string | Display name of role |
| `admin.role.type` | enum | One of: `super_admin`, `admin`, `content_editor`, `viewer` |
| `admin.role.permissions` | string[] | Array of permission strings |

**Role Types:**
- `super_admin` - Full system access
- `admin` - Manage content and users
- `content_editor` - Create/edit questions and exams
- `viewer` - Read-only access

**Common Permissions:**
- `manage_admins` - Create, edit, delete admins
- `manage_roles` - Create, edit roles and permissions
- `manage_content` - Manage blog posts, authors
- `manage_exams` - Create, edit exams
- `manage_papers` - Create, edit papers
- `manage_questions` - Create, edit questions
- `view_analytics` - View dashboard analytics
- `manage_settings` - System settings

### Error Responses

**400 Bad Request** - Invalid request format
```json
{
  "message": "Invalid request format",
  "error": "BAD_REQUEST"
}
```

**401 Unauthorized** - Invalid or expired OTP
```json
{
  "message": "Invalid or expired OTP",
  "error": "UNAUTHORIZED"
}
```

**404 Not Found** - Email not found
```json
{
  "message": "Admin not found",
  "error": "NOT_FOUND"
}
```

**500 Internal Server Error** - Server error
```json
{
  "message": "Internal server error",
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## JWT Token Format

### Token Structure
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.PAYLOAD.SIGNATURE
```

### Decoded Payload
```json
{
  "sub": "674a8d001c9d440000a1b0a1",
  "email": "admin@example.com",
  "role": "super_admin",
  "permissions": ["manage_admins", "manage_content"],
  "iat": 1733598000,
  "exp": 1734202800
}
```

**Claims:**
- `sub` - Subject (admin user ID)
- `email` - Admin email
- `role` - Role type
- `permissions` - Array of permissions
- `iat` - Issued at (Unix timestamp)
- `exp` - Expires at (Unix timestamp, 7 days from iat)

---

## OTP Requirements

### OTP Generation
- **Length:** 6 digits
- **Format:** Numeric only (000000 - 999999)
- **Expiry:** 5-10 minutes
- **Storage:** Store in database or Redis with TTL

### OTP Email Template
```
Subject: Your IITian Squad Admin Login Code

Hi [Admin Name],

Your verification code is: 123456

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
IITian Squad Team
```

---

## Rate Limiting

### Recommended Limits

**Request OTP:**
- 3 requests per email per hour
- 10 requests per IP per hour

**Verify OTP:**
- 5 attempts per email per 10 minutes
- After 5 failed attempts, lock for 30 minutes

---

## CORS Configuration

### Required Headers
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

### Spring Boot Configuration
```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/v1/**")
                .allowedOrigins("http://localhost:3000", "https://admin.iitiansquad.com")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

---

## Example Backend Implementation (Java)

### Controller
```java
@RestController
@RequestMapping("/v1/auth/user")
@RequiredArgsConstructor
public class UserAuthController {

    private final UserAuthenticationService authService;

    @PostMapping("/request-otp/{email}")
    public ResponseEntity<String> requestOtp(@PathVariable String email) {
        authService.requestOtp(email);
        return ResponseEntity.ok("OTP sent to email.");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<LoginResponse> verifyOtp(@RequestBody VerifyOtpRequest request) {
        LoginResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(response);
    }
}
```

### Request DTO
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerifyOtpRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "OTP is required")
    @Pattern(regexp = "^\\d{6}$", message = "OTP must be 6 digits")
    private String otp;
}
```

### Response DTO
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private AdminDto admin;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDto {
    private String id;
    private String name;
    private String email;
    private RoleDto role;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleDto {
    private String id;
    private String name;
    private String type;
    private List<String> permissions;
}
```

---

## Testing Checklist

### Manual Testing
- [ ] Request OTP with valid email
- [ ] Request OTP with invalid email
- [ ] Request OTP with non-existent email
- [ ] Verify OTP with correct code
- [ ] Verify OTP with incorrect code
- [ ] Verify OTP with expired code
- [ ] Test rate limiting
- [ ] Test OTP resend
- [ ] Test token expiry
- [ ] Test CORS headers

### Automated Testing
```bash
# Request OTP
curl -X POST http://localhost:8080/v1/auth/user/request-otp/admin@example.com

# Verify OTP
curl -X POST http://localhost:8080/v1/auth/user/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","otp":"123456"}'

# Use token
curl -X GET http://localhost:8080/v1/admin/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Security Checklist

- [ ] OTP expires after 10 minutes
- [ ] OTP is single-use (deleted after verification)
- [ ] Rate limiting implemented
- [ ] JWT tokens expire after 7 days
- [ ] Passwords are hashed (bcrypt)
- [ ] HTTPS in production
- [ ] CORS properly configured
- [ ] Input validation on all fields
- [ ] SQL injection prevention
- [ ] XSS prevention

---

## Production Considerations

### Environment Variables
```properties
# JWT
JWT_SECRET=your-256-bit-secret-key-here
JWT_EXPIRATION=604800000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=noreply@iitiansquad.com
SMTP_PASSWORD=your-app-password

# Rate Limiting
RATE_LIMIT_OTP_PER_EMAIL=3
RATE_LIMIT_OTP_PER_IP=10
RATE_LIMIT_VERIFY_PER_EMAIL=5

# OTP
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
```

### Monitoring
- Log all OTP requests
- Log failed OTP verifications
- Monitor rate limit violations
- Track token generation
- Alert on suspicious activity

---

## Support

For questions or issues with the API contract:
1. Refer to this document
2. Check `API_INTEGRATION.md` for frontend integration
3. Check `ADMIN_LOGIN_API_INTEGRATION.md` for complete flow
4. Test endpoints with Postman/cURL
5. Check backend logs for errors

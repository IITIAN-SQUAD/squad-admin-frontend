# New Two-Step Admin Login Flow

## Overview
The admin login has been updated to a **two-step process**:
1. **Step 1:** Enter email → Receive OTP
2. **Step 2:** Enter OTP + Password → Login

---

## 🔄 New Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  NEW TWO-STEP LOGIN FLOW                    │
└─────────────────────────────────────────────────────────────┘

STEP 1: Request OTP
1. Admin opens /login page
2. Admin enters email address
3. Click "Send OTP" button
   ↓
4. Frontend → POST /v1/auth/user/request-otp/{email}
   ↓
5. Backend sends OTP to email
   ↓
6. Frontend shows Step 2 form

STEP 2: Login with OTP and Password
7. Admin enters:
   - 6-digit OTP (from email)
   - Password
8. Click "Sign In" button
   ↓
9. Frontend → POST /v1/auth/user/login-with-otp
   Body: { email, otp, password }
   ↓
10. Backend validates OTP and password
   ↓
11. Backend returns JWT token + admin data
   ↓
12. Frontend stores token and redirects to dashboard
```

---

## 📡 API Endpoints

### 1. Request OTP (Step 1)
```
POST /v1/auth/user/request-otp/{email}
```

**Frontend sends:**
- Path parameter: `email` (e.g., "admin@example.com")

**Backend returns:**
```json
{
  "message": "OTP sent to email."
}
```

**Backend should:**
1. Validate email exists in database
2. Generate 6-digit OTP
3. Store OTP with 5-10 min expiry
4. Send OTP via email
5. Return success message

---

### 2. Login with OTP and Password (Step 2)
```
POST /v1/auth/user/login-with-otp
```

**Frontend sends:**
```json
{
  "email": "admin@example.com",
  "otp": "123456",
  "password": "Admin@123"
}
```

**Backend returns:**
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

**Backend should:**
1. Validate OTP exists and not expired
2. Validate OTP matches
3. Validate password matches (bcrypt)
4. Generate JWT token
5. Return token + admin user data
6. Clear OTP from storage

---

## 🎨 UI Changes

### Step 1: Email Input Screen
- **Title:** "IITian Squad Admin"
- **Description:** "Enter your email to receive OTP"
- **Fields:**
  - Email address input
- **Button:** "Send OTP"

### Step 2: OTP + Password Screen
- **Title:** "Verify & Login"
- **Description:** "Enter OTP sent to {email} and your password"
- **Fields:**
  - OTP input (6 digits, centered, large text)
  - Password input (with show/hide toggle)
- **Buttons:**
  - "Sign In" (primary)
  - "Resend Code" (with 60s timer)
  - "Back to Email" (secondary)

---

## 📝 Files Modified

### 1. `src/schemas/admin.ts`
**Added:**
```typescript
// Step 1: Request OTP with email only
export const requestOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Step 2: Login with email, OTP, and password
export const loginWithOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
  password: z.string().min(1, "Password is required"),
});

export type RequestOtpFormData = z.infer<typeof requestOtpSchema>;
export type LoginWithOtpFormData = z.infer<typeof loginWithOtpSchema>;
```

### 2. `src/services/auth.service.ts`
**Added:**
```typescript
export interface LoginWithOtpRequest {
  email: string;
  otp: string;
  password: string;
}

/**
 * Login with email, OTP, and password
 * POST /v1/auth/user/login-with-otp
 */
async loginWithOtp(data: LoginWithOtpRequest): Promise<VerifyOtpResponse> {
  const response = await apiClient.post<VerifyOtpResponse>(
    '/v1/auth/user/login-with-otp',
    data
  );
  return response;
}
```

### 3. `src/components/auth/LoginForm.tsx`
**Complete rewrite with:**
- Two-step state management (`step: 'email' | 'otp'`)
- Separate forms for each step
- Email form (Step 1)
- OTP + Password form (Step 2)
- Resend OTP functionality
- Back to email functionality

---

## 🧪 Testing

### Manual Testing Steps

1. **Test Step 1: Request OTP**
   ```bash
   # Start backend
   ./mvnw spring-boot:run
   
   # Start frontend
   npm run dev
   
   # Open browser
   http://localhost:3000/login
   
   # Enter email and click "Send OTP"
   # Check email for OTP code
   ```

2. **Test Step 2: Login**
   ```bash
   # Enter OTP from email
   # Enter password
   # Click "Sign In"
   # Should redirect to dashboard
   ```

3. **Test Resend OTP**
   ```bash
   # Wait for timer to expire (60s)
   # Click "Resend Code"
   # Check email for new OTP
   ```

4. **Test Back Button**
   ```bash
   # Click "Back to Email"
   # Should return to Step 1
   ```

### API Testing

**Request OTP:**
```bash
curl -X POST http://localhost:8080/v1/auth/user/request-otp/admin@example.com
```

**Login with OTP:**
```bash
curl -X POST http://localhost:8080/v1/auth/user/login-with-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "otp": "123456",
    "password": "Admin@123"
  }'
```

---

## 🔧 Backend Implementation

### Controller
```java
@RestController
@RequestMapping("/v1/auth/user")
@RequiredArgsConstructor
public class UserAuthController {

    private final UserAuthenticationService authService;

    // Step 1: Request OTP
    @PostMapping("/request-otp/{email}")
    public ResponseEntity<String> requestOtp(@PathVariable String email) {
        authService.requestOtp(email);
        return ResponseEntity.ok("OTP sent to email.");
    }

    // Step 2: Login with OTP and password
    @PostMapping("/login-with-otp")
    public ResponseEntity<LoginResponse> loginWithOtp(@RequestBody LoginWithOtpRequest request) {
        LoginResponse response = authService.loginWithOtp(request);
        return ResponseEntity.ok(response);
    }
}
```

### Request DTO
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginWithOtpRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "OTP is required")
    @Pattern(regexp = "^\\d{6}$", message = "OTP must be 6 digits")
    private String otp;

    @NotBlank(message = "Password is required")
    private String password;
}
```

### Service Implementation
```java
@Service
@RequiredArgsConstructor
public class UserAuthenticationService {

    private final AdminRepository adminRepository;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    public void requestOtp(String email) {
        // 1. Find admin by email
        Admin admin = adminRepository.findByEmail(email)
            .orElseThrow(() -> new NotFoundException("Admin not found"));

        // 2. Generate OTP
        String otp = otpService.generateOtp();

        // 3. Store OTP with expiry (10 minutes)
        otpService.storeOtp(email, otp, Duration.ofMinutes(10));

        // 4. Send OTP via email
        emailService.sendOtp(email, otp, admin.getName());
    }

    public LoginResponse loginWithOtp(LoginWithOtpRequest request) {
        // 1. Validate OTP
        if (!otpService.validateOtp(request.getEmail(), request.getOtp())) {
            throw new UnauthorizedException("Invalid or expired OTP");
        }

        // 2. Find admin
        Admin admin = adminRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new NotFoundException("Admin not found"));

        // 3. Validate password
        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            throw new UnauthorizedException("Invalid password");
        }

        // 4. Clear OTP
        otpService.clearOtp(request.getEmail());

        // 5. Generate JWT token
        String token = jwtService.generateToken(admin);

        // 6. Build response
        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setAdmin(mapToDto(admin));

        return response;
    }
}
```

---

## 🔐 Security Considerations

1. **OTP Expiry:** OTPs expire after 10 minutes
2. **Single Use:** OTP is deleted after successful login
3. **Rate Limiting:** Limit OTP requests (3 per email per hour)
4. **Password Validation:** Password is validated along with OTP
5. **Failed Attempts:** Lock account after 5 failed login attempts
6. **HTTPS:** Use HTTPS in production
7. **CORS:** Configure CORS properly

---

## 📊 Comparison: Old vs New Flow

### Old Flow (Email + Password → OTP)
```
1. Enter email + password
2. Backend validates credentials
3. Backend sends OTP
4. Enter OTP
5. Login
```

### New Flow (Email → OTP + Password)
```
1. Enter email
2. Backend sends OTP
3. Enter OTP + password
4. Backend validates both
5. Login
```

**Advantages of New Flow:**
- ✅ Clearer two-step process
- ✅ User knows OTP is coming before entering password
- ✅ Better UX with step-by-step guidance
- ✅ Password and OTP validated together (more secure)
- ✅ Easier to understand for users

---

## 🚀 Deployment Checklist

- [ ] Update `.env.local` with `NEXT_PUBLIC_API_BASE_URL`
- [ ] Backend implements `/request-otp/{email}` endpoint
- [ ] Backend implements `/login-with-otp` endpoint
- [ ] Email service configured for OTP delivery
- [ ] OTP storage (Redis/Database) configured
- [ ] JWT token generation working
- [ ] CORS configured for frontend origin
- [ ] Rate limiting implemented
- [ ] Test email delivery
- [ ] Test complete login flow
- [ ] Test resend OTP functionality
- [ ] Test error scenarios

---

## 📞 Support

For issues:
1. Check browser console for errors
2. Check backend logs
3. Test API endpoints with Postman/cURL
4. Verify email delivery
5. Check OTP expiry settings

**Happy Coding! 🎉**

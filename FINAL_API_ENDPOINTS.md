# Final API Endpoints - Admin Login

## ✅ Correct Backend Endpoints

Based on your backend controller, here are the correct endpoints:

---

## 🔄 Two-Step Login Flow

### Step 1: Request OTP
```
POST /v1/auth/user/request-otp/{email}
```

**Frontend sends:**
- Path parameter: `email` (e.g., "admin@gmail.com")
- No request body

**Example:**
```bash
curl -X POST http://localhost:8080/v1/auth/user/request-otp/admin@gmail.com
```

**Backend returns:**
```json
{
  "message": "OTP sent to email."
}
```

Or simply:
```
OTP sent to email.
```

---

### Step 2: Login with Email, Password, and OTP
```
POST /v1/auth/admin/login
```

**Frontend sends:**
```json
{
  "email": "admin@gmail.com",
  "password": "admin123",
  "otp": "123321"
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "admin123",
    "otp": "123321"
  }'
```

**Backend returns:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "admin": {
    "id": "6930b317efd96d07f7bfb531",
    "name": "Admin User",
    "email": "admin@gmail.com",
    "role": {
      "id": "role_id",
      "name": "Super Admin",
      "type": "super_admin",
      "permissions": ["manage_admins", "manage_content", "manage_exams"]
    }
  }
}
```

---

## 📝 Frontend Configuration

### Updated Files:
- ✅ `src/services/auth.service.ts`
  - `requestOtp()` → `POST /v1/auth/user/request-otp/{email}`
  - `loginWithOtp()` → `POST /v1/auth/admin/login`

### Environment:
```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

---

## 🎨 UI Flow

### Step 1: Email Input
1. User opens `/login`
2. User enters email: `admin@gmail.com`
3. User clicks "Send OTP"
4. Frontend calls: `POST /v1/auth/user/request-otp/admin@gmail.com`
5. Backend sends OTP to email
6. UI shows Step 2

### Step 2: OTP + Password Input
7. User enters OTP: `123321` (from email)
8. User enters password: `admin123`
9. User clicks "Sign In"
10. Frontend calls: `POST /v1/auth/admin/login` with `{ email, password, otp }`
11. Backend validates and returns token
12. Frontend stores token and redirects to dashboard

---

## 🧪 Testing

### Test Request OTP:
```bash
curl -X POST http://localhost:8080/v1/auth/user/request-otp/admin@gmail.com
```

**Expected Response:**
```
OTP sent to email.
```

### Test Login:
```bash
curl -X POST http://localhost:8080/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "admin123",
    "otp": "123321"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "admin": {
    "id": "6930b317efd96d07f7bfb531",
    "name": "Admin User",
    "email": "admin@gmail.com",
    "role": {
      "id": "role_id",
      "name": "Super Admin",
      "type": "super_admin",
      "permissions": ["manage_admins", "manage_content"]
    }
  }
}
```

---

## 🔧 Backend Controller Structure

### Your Controller:
```java
@RestController
@RequestMapping("/v1/auth/user")
public class UserAuthController {

    private final UserAuthenticationService userAuthenticationService;

    // Step 1: Request OTP
    @PostMapping("/request-otp/{email}")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<String> requestOtp(@PathVariable("email") String email) {
        userAuthenticationService.requestOtp(email);
        return ResponseEntity.ok("OTP sent to email.");
    }
}
```

### Login Controller (Different base path):
```java
@RestController
@RequestMapping("/v1/auth/admin")
public class AdminAuthController {

    private final AdminAuthenticationService adminAuthenticationService;

    // Step 2: Login with OTP and password
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = adminAuthenticationService.login(request);
        return ResponseEntity.ok(response);
    }
}
```

### Request DTO:
```java
@Data
public class LoginRequest {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String password;

    @NotBlank
    @Size(min = 6, max = 6)
    private String otp;
}
```

### Response DTO:
```java
@Data
public class LoginResponse {
    private String token;
    private AdminDto admin;
}

@Data
public class AdminDto {
    private String id;
    private String name;
    private String email;
    private RoleDto role;
}

@Data
public class RoleDto {
    private String id;
    private String name;
    private String type;
    private List<String> permissions;
}
```

---

## 🚀 Ready to Test!

1. **Start backend:**
   ```bash
   ./mvnw spring-boot:run
   ```

2. **Start frontend:**
   ```bash
   cd squad-admin-frontend
   npm run dev
   ```

3. **Test login:**
   - Go to `http://localhost:3000/login`
   - Enter email: `admin@gmail.com`
   - Click "Send OTP"
   - Check email for OTP
   - Enter OTP and password
   - Click "Sign In"
   - Should redirect to dashboard

---

## 🐛 Troubleshooting

### "Failed to send OTP"
- ✅ Check if backend is running on port 8080
- ✅ Check backend logs for errors
- ✅ Verify email exists in database
- ✅ Check email service configuration

### "Login failed"
- ✅ Check if OTP is correct
- ✅ Check if OTP has expired
- ✅ Check if password is correct
- ✅ Verify backend response format matches expected format

### "Network error"
- ✅ Check CORS configuration on backend
- ✅ Verify backend URL in `.env.local`
- ✅ Check browser console for errors

---

## ✨ Summary

**Frontend is configured to call:**
1. ✅ `POST /v1/auth/user/request-otp/{email}` - Send OTP
2. ✅ `POST /v1/auth/admin/login` - Login with email, password, OTP

**Backend should:**
1. ✅ Implement both endpoints
2. ✅ Return correct response format
3. ✅ Configure CORS for `http://localhost:3000`

**You're all set! 🎉**

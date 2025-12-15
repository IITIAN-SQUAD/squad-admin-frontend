# Admin Profile Integration - Complete

## ✅ What Was Done

### 1. Added GET Admin Profile API
**File:** `src/services/auth.service.ts`

Added new method:
```typescript
async getAdminProfile(): Promise<VerifyOtpResponse> {
  const response = await apiClient.get<VerifyOtpResponse>('/v1/auth/admin');
  return response;
}
```

**Endpoint:** `GET /v1/auth/admin`

**Headers Required:**
- `Cookie: jwt=<token>` (automatically sent by browser)
- `Content-Type: application/json`

---

### 2. Updated API Client for Cookie Support
**File:** `src/services/api-client.ts`

Added `credentials: 'include'` to all requests:
```typescript
const config: RequestInit = {
  ...options,
  credentials: 'include', // Include cookies in requests
  headers: {
    'Content-Type': 'application/json',
    ...options.headers,
  },
};
```

This ensures the JWT cookie is sent with every request.

---

### 3. Updated AuthContext to Fetch Profile on Mount
**File:** `src/contexts/AuthContext.tsx`

On app load, if auth token exists:
1. Calls `GET /v1/auth/admin` to fetch latest admin data
2. Updates localStorage with fresh admin data
3. Sets admin in React state

```typescript
useEffect(() => {
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        // Fetch admin profile from backend
        const authService = (await import('@/src/services/auth.service')).default;
        const response = await authService.getAdminProfile();
        
        // Update stored admin data
        localStorage.setItem('admin', JSON.stringify(response.admin));
        setAdmin(response.admin);
      }
    } catch (error) {
      // Token invalid, clear storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('admin');
      document.cookie = 'auth_token=; path=/; max-age=0';
    } finally {
      setIsLoading(false);
    }
  };

  checkAuth();
}, []);
```

---

### 4. Updated Navbar to Show Real Admin Data
**File:** `components/layout/Navbar.tsx`

**Removed hardcoding:**
- ❌ "Admin User" (hardcoded name)
- ❌ "Super Admin" (hardcoded role)

**Now shows:**
- ✅ Admin name from API
- ✅ Admin email from API
- ✅ Admin role name from API

```typescript
const [adminName, setAdminName] = React.useState("");
const [adminRole, setAdminRole] = React.useState("");
const [adminEmail, setAdminEmail] = React.useState("");

// Reads from localStorage
const adminData = JSON.parse(admin);
setAdminName(adminData.name || "");
setAdminEmail(adminData.email || "");
setAdminRole(adminData.role?.name || "");
```

**Dropdown shows:**
```
John Doe
admin@gmail.com
Super Admin
```

---

### 5. Updated Sidebar to Show Real Admin Data
**File:** `components/layout/Sidebar.tsx`

Already was reading from localStorage, but added:
- Storage event listener for cross-tab updates
- Periodic refresh every 2 seconds for same-tab updates

```typescript
useEffect(() => {
  const loadAdminData = () => {
    const admin = localStorage.getItem('admin');
    if (admin) {
      const adminData = JSON.parse(admin);
      setAdminName(adminData.name || "Admin");
      setAdminRole(adminData.role?.name || "Administrator");
    }
  };

  loadAdminData();
  window.addEventListener('storage', loadAdminData);
  const interval = setInterval(loadAdminData, 2000);

  return () => {
    window.removeEventListener('storage', loadAdminData);
    clearInterval(interval);
  };
}, []);
```

**Sidebar footer shows:**
- Avatar with initials
- Admin name
- Admin role

---

## 🔄 Data Flow

```
1. User logs in
   ↓
2. Backend returns JWT token in cookie + admin data
   ↓
3. Frontend stores token in localStorage and cookie
   ↓
4. Frontend stores admin data in localStorage
   ↓
5. On app load/refresh:
   - Check if token exists
   - Call GET /v1/auth/admin (with JWT cookie)
   - Update admin data in localStorage
   ↓
6. UI components read from localStorage:
   - Navbar: Shows name, email, role
   - Sidebar: Shows name, role, avatar
```

---

## 📡 Backend API Expected Response

### GET /v1/auth/admin

**Request:**
```bash
curl --location --request GET 'localhost:8080/v1/auth/admin' \
--header 'Content-Type: application/json' \
--header 'Cookie: jwt=<your_jwt_token>'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "admin": {
    "id": "6935ecde00f77bacc6e3e31e",
    "name": "John Doe",
    "email": "admin@gmail.com",
    "role": {
      "id": "role_123",
      "name": "Super Admin",
      "type": "SUPER_ADMIN",
      "permissions": ["MANAGE_ADMINS", "MANAGE_CONTENT", "MANAGE_EXAMS"]
    }
  }
}
```

**Note:** The `token` field can be the same JWT or a refreshed one.

---

## 🎯 No More Hardcoding!

### Before:
```typescript
// ❌ Hardcoded
const adminName = "Admin User";
const adminRole = "Super Admin";
```

### After:
```typescript
// ✅ From API
const adminData = JSON.parse(localStorage.getItem('admin'));
const adminName = adminData.name; // "John Doe"
const adminRole = adminData.role.name; // "Super Admin"
const adminEmail = adminData.email; // "admin@gmail.com"
```

---

## 🧪 Testing

### 1. Test Login Flow
```bash
# Start backend
./mvnw spring-boot:run

# Start frontend
npm run dev

# Login at http://localhost:3000/login
# Enter email, OTP, password
# Should redirect to dashboard
```

### 2. Verify Admin Data in UI
- **Navbar (top right):**
  - Click avatar
  - Should show: Name, Email, Role
  
- **Sidebar (bottom):**
  - Should show: Avatar with initials, Name, Role

### 3. Test Profile Refresh
```bash
# Open browser console
localStorage.getItem('admin')

# Should show admin data from backend
```

### 4. Test API Call
```bash
# Get JWT from cookie or localStorage
# Call API
curl --location --request GET 'localhost:8080/v1/auth/admin' \
--header 'Content-Type: application/json' \
--header 'Cookie: jwt=<your_jwt_token>'

# Should return admin profile
```

---

## 🔧 Backend Requirements

### Your backend must:

1. **Implement GET /v1/auth/admin**
   - Read JWT from cookie
   - Validate JWT
   - Fetch admin from database
   - Return admin data

2. **Example Controller:**
```java
@RestController
@RequestMapping("/v1/auth/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private JwtService jwtService;

    @GetMapping
    public ResponseEntity<AdminResponse> getAdminProfile(
            @CookieValue(name = "jwt", required = false) String jwtToken) {
        
        if (jwtToken == null) {
            throw new UnauthorizedException("No JWT token found");
        }

        // Validate JWT
        if (!jwtService.validateToken(jwtToken)) {
            throw new UnauthorizedException("Invalid JWT token");
        }

        // Get admin ID from JWT
        String adminId = jwtService.getAdminIdFromToken(jwtToken);

        // Fetch admin from database
        Admin admin = adminService.getAdminById(adminId);

        // Build response
        AdminResponse response = new AdminResponse();
        response.setToken(jwtToken); // or generate new token
        response.setAdmin(mapToDto(admin));

        return ResponseEntity.ok(response);
    }
}
```

3. **Response DTO:**
```java
@Data
public class AdminResponse {
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

## 🐛 Troubleshooting

### "Failed to fetch admin profile"
- ✅ Check if JWT cookie is being sent
- ✅ Check backend logs for errors
- ✅ Verify JWT is valid and not expired
- ✅ Check CORS configuration

### Admin data not showing in UI
- ✅ Check browser console for errors
- ✅ Check localStorage: `localStorage.getItem('admin')`
- ✅ Verify API response format matches expected format
- ✅ Check if admin data has `name`, `email`, `role.name`

### Cookie not being sent
- ✅ Verify `credentials: 'include'` in API client
- ✅ Check backend CORS allows credentials
- ✅ Verify cookie domain and path settings

---

## ✨ Summary

**Frontend changes:**
1. ✅ Added `getAdminProfile()` method in auth service
2. ✅ Updated API client to include cookies
3. ✅ AuthContext fetches profile on mount
4. ✅ Navbar shows real name, email, role
5. ✅ Sidebar shows real name, role, avatar
6. ✅ No more hardcoded admin data!

**Backend requirements:**
1. ⏳ Implement `GET /v1/auth/admin`
2. ⏳ Read JWT from cookie
3. ⏳ Return admin profile with role

**You're all set! 🎉**

# Logout API Integration - Complete

## ✅ What Was Done

### 1. Updated Logout API Endpoint
**File:** `src/services/auth.service.ts`

Changed from:
```typescript
// ❌ Old
await apiClient.post('/v1/auth/user/logout');
```

To:
```typescript
// ✅ New
await apiClient.post('/v1/auth/admin/logout');
```

**Endpoint:** `POST /v1/auth/admin/logout`

**Headers:**
- `Cookie: jwt=<token>` (automatically sent)
- `Content-Type: application/json`

---

### 2. Updated Navbar Logout
**File:** `components/layout/Navbar.tsx`

Now calls the logout API before clearing local storage:

```typescript
const handleLogout = async () => {
  try {
    // Call logout API
    const authService = (await import('@/src/services/auth.service')).default;
    await authService.logout();
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    // Clear local storage and cookies regardless of API response
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin');
    
    // Clear cookies
    document.cookie = 'auth_token=; path=/; max-age=0';
    document.cookie = 'jwt=; path=/; max-age=0';
    
    setIsLoggedIn(false);
    window.location.href = '/login';
  }
};
```

---

### 3. Updated Sidebar Logout
**File:** `components/layout/Sidebar.tsx`

Same implementation as Navbar - calls API then clears storage.

---

### 4. Updated AuthContext Logout
**File:** `src/contexts/AuthContext.tsx`

Updated the logout method in AuthContext to call the API.

---

## 🔄 Logout Flow

```
1. User clicks "Logout" button
   ↓
2. Frontend calls: POST /v1/auth/admin/logout
   (with JWT cookie)
   ↓
3. Backend invalidates the session/token
   ↓
4. Frontend clears:
   - localStorage: auth_token, admin
   - Cookies: auth_token, jwt
   ↓
5. Redirect to /login
```

---

## 📡 Backend API Requirements

### POST /v1/auth/admin/logout

**Request:**
```bash
curl --location --request POST 'localhost:8080/v1/auth/admin/logout' \
--header 'Content-Type: application/json' \
--header 'Cookie: jwt=<your_jwt_token>'
```

**Expected Response:**
```json
{
  "message": "Logout successful"
}
```

Or simply:
```
200 OK
```

**What Backend Should Do:**
1. Read JWT from cookie
2. Validate JWT
3. Invalidate the token/session:
   - Add token to blacklist (if using token blacklist)
   - Delete session from database (if using sessions)
   - Mark token as revoked
4. Clear JWT cookie in response
5. Return success message

---

## 🔧 Backend Implementation Example

### Controller
```java
@RestController
@RequestMapping("/v1/auth/admin")
@RequiredArgsConstructor
public class AdminAuthController {

    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;

    @PostMapping("/logout")
    public ResponseEntity<String> logout(
            @CookieValue(name = "jwt", required = false) String jwtToken,
            HttpServletResponse response) {
        
        if (jwtToken != null) {
            // Invalidate the token
            tokenBlacklistService.blacklistToken(jwtToken);
            
            // Clear the JWT cookie
            Cookie cookie = new Cookie("jwt", null);
            cookie.setPath("/");
            cookie.setMaxAge(0);
            cookie.setHttpOnly(true);
            response.addCookie(cookie);
        }
        
        return ResponseEntity.ok("Logout successful");
    }
}
```

### Token Blacklist Service (Optional but Recommended)
```java
@Service
public class TokenBlacklistService {
    
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    @Autowired
    private JwtService jwtService;
    
    public void blacklistToken(String token) {
        // Get token expiration
        Date expiration = jwtService.getExpirationFromToken(token);
        long ttl = expiration.getTime() - System.currentTimeMillis();
        
        if (ttl > 0) {
            // Store in Redis with TTL
            redisTemplate.opsForValue().set(
                "blacklist:" + token, 
                "true", 
                ttl, 
                TimeUnit.MILLISECONDS
            );
        }
    }
    
    public boolean isBlacklisted(String token) {
        return Boolean.TRUE.equals(
            redisTemplate.hasKey("blacklist:" + token)
        );
    }
}
```

### JWT Filter Update
```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private TokenBlacklistService tokenBlacklistService;
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        String token = extractTokenFromCookie(request);
        
        if (token != null && jwtService.validateToken(token)) {
            // Check if token is blacklisted
            if (tokenBlacklistService.isBlacklisted(token)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
            
            // Continue with authentication...
        }
        
        filterChain.doFilter(request, response);
    }
}
```

---

## 🧪 Testing

### 1. Test Logout Flow
```bash
# Login first
# Then click logout button in UI

# Check browser:
# - localStorage should be empty
# - Cookies should be cleared
# - Should redirect to /login
```

### 2. Test API Call
```bash
# Get JWT from cookie
# Call logout API
curl --location --request POST 'localhost:8080/v1/auth/admin/logout' \
--header 'Content-Type: application/json' \
--header 'Cookie: jwt=<your_jwt_token>'

# Should return success
```

### 3. Test Token Invalidation
```bash
# After logout, try to use the same token
curl --location --request GET 'localhost:8080/v1/auth/admin' \
--header 'Cookie: jwt=<old_jwt_token>'

# Should return 401 Unauthorized
```

---

## 🎯 Logout Locations in UI

### 1. Navbar (Top Right)
- Click avatar dropdown
- Click "Log out" option
- Calls `handleLogout()`

### 2. Sidebar (Bottom)
- Click logout icon button
- Calls `handleLogout()`

### 3. AuthContext
- Programmatic logout
- `const { logout } = useAuth();`
- `await logout();`

---

## 🔐 Security Features

### Frontend:
1. ✅ Calls logout API before clearing storage
2. ✅ Clears both `auth_token` and `jwt` cookies
3. ✅ Clears localStorage
4. ✅ Redirects to login page
5. ✅ Handles API errors gracefully

### Backend Should:
1. ⏳ Invalidate JWT token
2. ⏳ Clear JWT cookie in response
3. ⏳ Blacklist token (if using token blacklist)
4. ⏳ Delete session (if using sessions)
5. ⏳ Return success response

---

## 🐛 Troubleshooting

### "Logout API error" in console
- ✅ Check if backend logout endpoint exists
- ✅ Check backend logs for errors
- ✅ Verify JWT cookie is being sent
- ✅ Note: Logout still works even if API fails

### Still logged in after logout
- ✅ Check if localStorage is cleared
- ✅ Check if cookies are cleared
- ✅ Hard refresh the page (Cmd+Shift+R)
- ✅ Check browser console for errors

### Token still valid after logout
- ✅ Backend needs to implement token blacklist
- ✅ Or use short-lived tokens with refresh tokens
- ✅ Check if backend is invalidating the token

---

## ✨ Summary

**Frontend:**
1. ✅ Updated logout endpoint to `/v1/auth/admin/logout`
2. ✅ Navbar calls logout API
3. ✅ Sidebar calls logout API
4. ✅ AuthContext calls logout API
5. ✅ Clears both `auth_token` and `jwt` cookies
6. ✅ Graceful error handling

**Backend Needs:**
1. ⏳ Implement `POST /v1/auth/admin/logout`
2. ⏳ Read JWT from cookie
3. ⏳ Invalidate the token
4. ⏳ Clear JWT cookie in response
5. ⏳ Return success message

**All logout buttons now call the API! 🎉**

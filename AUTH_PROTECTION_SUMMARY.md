# Authentication Protection System

## Overview
Complete authentication protection system that requires login before accessing any features. Users start at `/login` by default.

## How It Works

### 1. **Entry Point**
- **Default Route**: `/login` (for unauthenticated users)
- **After Login**: `/` (dashboard)

### 2. **Protection Layers**

#### **Layer 1: Middleware** (`middleware.ts`)
- Runs on **server-side** before page loads
- Checks for `auth_token` cookie
- Redirects to `/login` if not authenticated
- Prevents access to protected routes

#### **Layer 2: Client-Side Check** (`AuthCheck.tsx`)
- Runs on **client-side** after page loads
- Double-checks localStorage for auth token
- Redirects to `/login` if token missing
- Backup protection layer

#### **Layer 3: Conditional Layout** (`ConditionalLayout.tsx`)
- Shows/hides sidebar and navbar based on route
- Auth pages: No sidebar/navbar
- Protected pages: Shows sidebar/navbar + auth check

## Protected Routes

### **Public Routes** (No Auth Required)
- `/login` - Login page
- `/forgot-password` - Password reset
- `/set-password` - Set new password

### **Protected Routes** (Auth Required)
- `/` - Dashboard (homepage)
- `/exam-management` - Exam management
- `/subject-management` - Subject management
- `/paper-management` - Paper management
- `/question-management` - Question management
- `/admin-management` - Admin management
- All other routes

## Authentication Flow

### **First Visit (Not Logged In)**
```
1. User visits any URL (e.g., /, /exam-management)
2. Middleware checks cookie → No auth_token found
3. Redirect to /login
4. User sees login screen (no sidebar/navbar)
```

### **Login Process**
```
1. User enters email/password
2. UI shows MFA screen
3. User enters OTP
4. On success:
   - Set localStorage: auth_token, admin
   - Set cookie: auth_token (for middleware)
   - Redirect to /
5. User sees dashboard with sidebar/navbar
```

### **Accessing Protected Pages**
```
1. User clicks sidebar link (e.g., /exam-management)
2. Middleware checks cookie → auth_token exists
3. Page loads
4. AuthCheck verifies localStorage → token exists
5. User sees page with sidebar/navbar
```

### **Logout Process**
```
1. User clicks avatar → "Log out"
2. Clear localStorage (auth_token, admin)
3. Clear cookie (auth_token)
4. Redirect to /login
5. User sees login screen
```

### **Direct URL Access (Not Logged In)**
```
1. User types /exam-management in browser
2. Middleware checks cookie → No auth_token
3. Redirect to /login
4. User must login first
```

## Files Created/Modified

### New Files
- `/middleware.ts` - Server-side auth protection
- `/components/auth/AuthCheck.tsx` - Client-side auth check
- `/app/not-found.tsx` - 404 page

### Modified Files
- `/components/layout/ConditionalLayout.tsx` - Added AuthCheck wrapper
- `/src/components/auth/LoginForm.tsx` - Sets cookie on login
- `/components/layout/Navbar.tsx` - Clears cookie on logout

## Storage Mechanisms

### **localStorage** (Client-Side)
```javascript
// Stored on login
localStorage.setItem('auth_token', 'token-value');
localStorage.setItem('admin', JSON.stringify(adminData));

// Checked by AuthCheck component
// Cleared on logout
```

### **Cookies** (Server-Side)
```javascript
// Set on login
document.cookie = 'auth_token=token-value; path=/; max-age=604800'; // 7 days

// Checked by middleware
// Cleared on logout
document.cookie = 'auth_token=; path=/; max-age=0';
```

## Security Features

### Current Implementation
- ✅ Middleware protection (server-side)
- ✅ Client-side auth check (double protection)
- ✅ Cookie-based authentication
- ✅ Automatic redirect to login
- ✅ Prevents direct URL access
- ✅ Clears all auth data on logout

### Production Requirements
- [ ] Replace mock tokens with real JWT
- [ ] Validate JWT signature in middleware
- [ ] Add token expiration check
- [ ] Implement refresh token mechanism
- [ ] Add CSRF protection
- [ ] Use httpOnly cookies for tokens
- [ ] Add rate limiting
- [ ] Implement session management

## Testing Scenarios

### Test 1: First Visit
1. Clear browser data
2. Visit `http://localhost:3001`
3. **Expected**: Redirected to `/login`

### Test 2: Direct URL Access
1. Clear browser data
2. Visit `http://localhost:3001/exam-management`
3. **Expected**: Redirected to `/login`

### Test 3: Login Flow
1. Visit `/login`
2. Enter any email/password
3. Enter any 6-digit OTP
4. **Expected**: Redirected to `/` with sidebar/navbar

### Test 4: Protected Page Access
1. Login first
2. Click any sidebar link
3. **Expected**: Page loads with sidebar/navbar

### Test 5: Logout
1. Login first
2. Click avatar → "Log out"
3. **Expected**: Redirected to `/login`, no sidebar/navbar

### Test 6: After Logout URL Access
1. Logout
2. Try to visit `/exam-management` directly
3. **Expected**: Redirected to `/login`

## Middleware Configuration

### Matched Routes
```javascript
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
]
```

### Excluded from Middleware
- `/_next/static/*` - Next.js static files
- `/_next/image/*` - Image optimization
- `/favicon.ico` - Favicon
- `/api/*` - API routes
- `/*.png`, `/*.jpg`, etc. - Static assets

## Edge Cases Handled

### 1. **Logged In User Visits /login**
- Middleware redirects to `/` (dashboard)
- Prevents seeing login screen when already logged in

### 2. **Token Exists in Cookie but Not localStorage**
- AuthCheck will redirect to login
- User must login again

### 3. **Token Exists in localStorage but Not Cookie**
- Middleware will redirect to login
- User must login again

### 4. **Browser Refresh on Protected Page**
- Middleware checks cookie → allows access
- AuthCheck verifies localStorage → allows access
- Page loads normally

### 5. **Multiple Tabs**
- Logout in one tab clears cookie
- Other tabs will redirect to login on next navigation

## Default Behavior

### **Root URL** (`/`)
- **Not Logged In**: Redirects to `/login`
- **Logged In**: Shows dashboard with stats

### **Any Protected URL**
- **Not Logged In**: Redirects to `/login`
- **Logged In**: Shows page with sidebar/navbar

### **Auth URLs** (`/login`, `/forgot-password`, `/set-password`)
- **Not Logged In**: Shows auth form
- **Logged In**: Redirects to `/` (for `/login` only)

## Production Deployment

### Environment Variables Needed
```env
# JWT Secret
JWT_SECRET=your-secret-key-here

# Cookie Settings
COOKIE_DOMAIN=.yourdomain.com
COOKIE_SECURE=true  # HTTPS only
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=strict
```

### Middleware Updates for Production
```typescript
// Validate JWT token
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const { payload } = await jwtVerify(authToken, secret);

// Check expiration
if (payload.exp && payload.exp < Date.now() / 1000) {
  // Token expired, redirect to login
}
```

## Benefits

1. **Double Protection**: Server + Client checks
2. **Seamless UX**: Automatic redirects
3. **Secure**: Cookie + localStorage approach
4. **Scalable**: Easy to add more protected routes
5. **Maintainable**: Centralized auth logic
6. **Fast**: Middleware runs before page load

## Notes

- ⚠️ Current implementation uses mock tokens
- ⚠️ Backend must validate tokens on API calls
- ⚠️ Production needs real JWT with expiration
- ✅ UI protection is complete
- ✅ All routes are protected by default
- ✅ Login is the entry point for new users

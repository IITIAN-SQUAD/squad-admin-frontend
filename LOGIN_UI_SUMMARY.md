# Admin Login UI - Frontend Only

## Overview
Simple login UI with email/password and MFA (OTP) screens. All validation will be handled by backend.

## What's Implemented

### 1. **Navbar with Login/Logout**
- **Location**: Top right corner of every page
- **When Logged Out**: Shows "Login" button with icon
- **When Logged In**: Shows user avatar with dropdown
  - Displays admin name and role
  - Logout option

### 2. **Login Screen** (`/login`)
- Email input field
- Password input field with show/hide toggle
- "Forgot password?" link
- "Sign In" button
- Clean UI with yellow branding

### 3. **MFA/OTP Screen**
- Appears after clicking "Sign In"
- Shows email where OTP was sent
- Large 6-digit OTP input field
- "Verify Code" button
- "Resend Code" button with 60-second cooldown
- "Back to Login" button

### 4. **Flow**
```
1. User enters email & password → clicks "Sign In"
2. UI switches to MFA screen
3. User enters 6-digit OTP → clicks "Verify Code"
4. User is redirected to dashboard
5. Navbar shows user avatar with logout option
```

## Files Created/Modified

### New Files
- `/components/layout/Navbar.tsx` - Top navbar with login/logout
- `/src/components/auth/LoginForm.tsx` - Login + MFA UI
- `/app/login/page.tsx` - Login page wrapper

### Modified Files
- `/app/layout.tsx` - Added Navbar component

## UI Features

### Navbar
- ✅ Sticky top position
- ✅ Shows on all pages
- ✅ Login button (when logged out)
- ✅ User avatar dropdown (when logged in)
- ✅ Logout functionality

### Login Form
- ✅ Email validation (format only)
- ✅ Password show/hide toggle
- ✅ Responsive design
- ✅ Loading states
- ✅ Clean error display

### MFA Form
- ✅ 6-digit OTP input (centered, large text)
- ✅ Email confirmation display
- ✅ Resend with countdown timer
- ✅ Back to login option
- ✅ Visual feedback (shield icon)

## Backend Integration Points

### API Endpoints Needed

#### 1. POST `/api/auth/login`
**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "requireMFA": true,
  "sessionToken": "session-token-here",
  "message": "OTP sent to email"
}
```

#### 2. POST `/api/auth/verify-mfa`
**Request:**
```json
{
  "email": "admin@example.com",
  "otp": "123456",
  "sessionToken": "session-token-here"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "admin": {
    "id": "1",
    "name": "Admin Name",
    "email": "admin@example.com",
    "role": {
      "name": "Super Admin",
      "type": "super_admin"
    }
  }
}
```

#### 3. POST `/api/auth/resend-otp`
**Request:**
```json
{
  "email": "admin@example.com",
  "sessionToken": "session-token-here"
}
```

**Response:**
```json
{
  "message": "OTP resent successfully"
}
```

## Current Behavior (Demo Mode)

### Login
- Any email/password will proceed to MFA screen
- No validation on credentials

### MFA
- Any 6-digit OTP will log you in
- Creates mock admin data in localStorage
- Redirects to dashboard

### Logout
- Clears localStorage
- Redirects to login page
- Navbar updates automatically

## Storage

### LocalStorage Keys
- `auth_token` - JWT token from backend
- `admin` - JSON string of admin object

### Admin Object Structure
```json
{
  "id": "1",
  "name": "Admin Name",
  "email": "admin@example.com",
  "role": {
    "name": "Super Admin",
    "type": "super_admin",
    "permissions": [...]
  }
}
```

## Testing

### Test the UI
1. Visit `http://localhost:3001/login`
2. Enter any email and password
3. Click "Sign In"
4. See MFA screen
5. Enter any 6 digits
6. Click "Verify Code"
7. Redirected to dashboard
8. See user avatar in top right
9. Click avatar → see dropdown
10. Click "Log out"
11. Back to login screen

## Next Steps for Backend Integration

1. **Replace API calls** in `LoginForm.tsx`
   - Remove mock responses
   - Handle actual errors from backend
   - Display backend error messages

2. **Add proper validation**
   - Backend validates email/password
   - Backend generates and sends OTP
   - Backend verifies OTP
   - Backend returns JWT token

3. **Security**
   - OTP expiration (10 minutes)
   - Rate limiting on login attempts
   - Session token validation
   - JWT token with expiration

4. **Email Service**
   - Send OTP to admin's email
   - Professional email template
   - Delivery tracking

## Notes

- ✅ UI is complete and functional
- ✅ No form validation errors
- ✅ Clean, professional design
- ✅ Responsive on all devices
- ✅ Navbar shows on all pages
- ✅ Login/logout flow works
- ⏳ Backend validation needed
- ⏳ Email service integration needed
- ⏳ Actual OTP generation needed

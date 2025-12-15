# Actual Backend API Integration

## ✅ Updated to Match Your Backend

Based on your cURL request, I've updated the frontend to match your actual backend API.

---

## 🔄 Your Backend Flow

### Step 1: Request OTP
```
POST /v1/auth/admin/request-otp
```

**Request Body:**
```json
{
  "email": "admin@gmail.com"
}
```

**Response:**
```json
{
  "message": "OTP sent to email."
}
```

---

### Step 2: Login with Email, Password, and OTP
```
POST /v1/auth/admin/login
```

**Request Body:**
```json
{
  "email": "admin@gmail.com",
  "password": "admin123",
  "otp": "123321"
}
```

**Expected Response:**
```json
{
  "token": "jwt_token_here",
  "admin": {
    "id": "string",
    "name": "string",
    "email": "admin@gmail.com",
    "role": {
      "id": "string",
      "name": "Super Admin",
      "type": "super_admin",
      "permissions": ["manage_admins", "manage_content"]
    }
  }
}
```

---

## 📝 Frontend Changes Made

### Updated Files:

1. **`src/services/auth.service.ts`**
   - ✅ Changed `requestOtp()` to use `POST /v1/auth/admin/request-otp`
   - ✅ Changed `loginWithOtp()` to use `POST /v1/auth/admin/login`
   - ✅ Sends `{ email, password, otp }` in request body

---

## 🧪 Testing

### Test with your backend:

1. **Start your backend:**
   ```bash
   # Make sure it's running on localhost:8080
   ```

2. **Start frontend:**
   ```bash
   cd squad-admin-frontend
   npm run dev
   ```

3. **Test login flow:**
   - Go to `http://localhost:3000/login`
   - Enter email: `admin@gmail.com`
   - Click "Send OTP"
   - Check email for OTP
   - Enter OTP: `123321` (or whatever you receive)
   - Enter password: `admin123`
   - Click "Sign In"

---

## 🔧 Backend Response Format

Your backend should return this format from `/v1/auth/admin/login`:

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
      "permissions": [
        "manage_admins",
        "manage_roles",
        "manage_content",
        "manage_exams",
        "manage_papers",
        "manage_questions",
        "view_analytics"
      ]
    }
  }
}
```

**Important:** The frontend expects:
- `token` (string) - JWT token
- `admin` (object) - Admin user data
- `admin.role` (object) - Role with permissions array

---

## 🐛 Troubleshooting

### If login fails:

1. **Check browser console** for error messages
2. **Check Network tab** to see actual request/response
3. **Verify backend response format** matches expected format above
4. **Check CORS** - Backend must allow `http://localhost:3000`

### Common Issues:

**Issue:** "Login failed"
- **Cause:** Backend response format doesn't match
- **Fix:** Ensure backend returns `{ token, admin }` structure

**Issue:** "Network error"
- **Cause:** Backend not running or CORS issue
- **Fix:** Start backend, configure CORS

**Issue:** "Invalid OTP"
- **Cause:** OTP expired or incorrect
- **Fix:** Request new OTP, check email

---

## 📊 Request/Response Examples

### Request OTP
```bash
curl -X POST http://localhost:8080/v1/auth/admin/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com"}'
```

### Login
```bash
curl -X POST http://localhost:8080/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "admin123",
    "otp": "123321"
  }'
```

---

## ✨ Frontend is Ready!

The frontend now correctly calls:
- ✅ `POST /v1/auth/admin/request-otp` with `{ email }`
- ✅ `POST /v1/auth/admin/login` with `{ email, password, otp }`

Just make sure your backend:
1. Implements these endpoints
2. Returns the expected response format
3. Has CORS configured for `http://localhost:3000`

**You're all set! 🎉**

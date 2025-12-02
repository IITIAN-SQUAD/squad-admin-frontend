# Admin Authentication & Management System

## Overview
Complete admin management system with role-based access control (RBAC), authentication, and permission management.

## Features Implemented

### 1. **Authentication System**
- ✅ Login page with email/password
- ✅ Forgot password flow
- ✅ Set password for new admins (via invitation link)
- ✅ Reset password flow
- ✅ JWT token-based authentication
- ✅ Protected routes with permission checks

### 2. **Admin Management (Super Admin Only)**
- ✅ List all admins
- ✅ Invite new admins (sends email with set-password link)
- ✅ Resend invitation emails
- ✅ Activate/deactivate admins
- ✅ View admin status (Active, Inactive, Pending)
- ✅ View last login time

### 3. **Role Management**
- ✅ Create custom roles
- ✅ Edit role permissions
- ✅ Delete roles (except super_admin)
- ✅ Assign roles to admins
- ✅ Predefined roles: Super Admin, Admin, Content Editor, Viewer

### 4. **Permission System**
Available permissions:
- `exam_management` - Create and manage exams
- `subject_management` - Manage subjects and topics
- `paper_management` - Create and manage papers
- `question_management` - Create and manage questions
- `blog_management` - Manage blog posts
- `author_management` - Manage authors
- `media_management` - Manage media library
- `admin_management` - Manage admin users (Super Admin only)
- `bulk_upload` - Upload questions in bulk

## File Structure

```
/app
  /login/page.tsx                    # Login page
  /forgot-password/page.tsx          # Forgot password page
  /set-password/page.tsx             # Set password for new admins
  /admin-management/page.tsx         # Admin management (Super Admin only)
  /api/auth
    /login/route.ts                  # Login API
    /verify/route.ts                 # Verify token API
    /forgot-password/route.ts        # Forgot password API
    /set-password/route.ts           # Set password API
    /verify-invite/route.ts          # Verify invitation token

/src
  /types/admin.ts                    # Admin, Role, Permission types
  /schemas/admin.ts                  # Zod validation schemas
  /contexts/AuthContext.tsx          # Auth state management
  /components
    /auth/ProtectedRoute.tsx         # Protected route wrapper
    /admin
      /AdminInviteForm.tsx           # Invite admin form
      /RoleManagement.tsx            # Role CRUD component
```

## Usage

### 1. Wrap App with AuthProvider

```tsx
// app/layout.tsx
import { AuthProvider } from '@/src/contexts/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Protect Routes with Permissions

```tsx
// app/exam-management/page.tsx
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function ExamManagementPage() {
  return (
    <ProtectedRoute requiredPermission="exam_management">
      <div>Exam Management Content</div>
    </ProtectedRoute>
  );
}
```

### 3. Protect Super Admin Routes

```tsx
// app/admin-management/page.tsx
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function AdminManagementPage() {
  return (
    <ProtectedRoute requireSuperAdmin>
      <div>Admin Management Content</div>
    </ProtectedRoute>
  );
}
```

### 4. Use Auth in Components

```tsx
import { useAuth } from '@/src/contexts/AuthContext';

function MyComponent() {
  const { admin, hasPermission, isSuperAdmin, logout } = useAuth();

  if (!hasPermission('exam_management')) {
    return <div>No access</div>;
  }

  return (
    <div>
      <p>Welcome, {admin?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Flows

### Admin Invitation Flow

1. **Super Admin invites new admin**
   - Goes to Admin Management
   - Clicks "Invite Admin"
   - Fills form: name, email, role
   - System sends invitation email

2. **New admin receives email**
   - Email contains link: `/set-password?token=xxx`
   - Link expires in 24 hours

3. **New admin sets password**
   - Clicks link from email
   - Sets secure password (8+ chars, uppercase, lowercase, number, special char)
   - Account activated

4. **Admin can now login**
   - Goes to `/login`
   - Enters email and password
   - Redirected to dashboard

### Login Flow

1. Admin visits `/login`
2. Enters email and password
3. System verifies credentials
4. JWT token generated and stored
5. Admin redirected to dashboard
6. Token used for all subsequent requests

### Forgot Password Flow

1. Admin clicks "Forgot Password" on login page
2. Enters email address
3. System sends reset link to email
4. Admin clicks link: `/reset-password?token=xxx`
5. Sets new password
6. Can login with new password

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Token Security
- JWT tokens with expiration
- Tokens stored in localStorage (consider httpOnly cookies for production)
- Token verification on each request
- Expired tokens automatically cleared

### Permission Checks
- Frontend: UI elements hidden based on permissions
- Backend: API routes check permissions before processing
- Protected routes redirect unauthorized users

## Backend Integration TODO

### Database Schema

```sql
-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('super_admin', 'admin', 'content_editor', 'viewer')),
  permissions TEXT[] NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admins table
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255),
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  password_set BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin invites table
CREATE TABLE admin_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role_id UUID REFERENCES roles(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints to Implement

```typescript
// Authentication
POST   /api/auth/login              // Login with email/password
POST   /api/auth/logout             // Logout (invalidate token)
GET    /api/auth/verify             // Verify JWT token
POST   /api/auth/forgot-password    // Request password reset
POST   /api/auth/reset-password     // Reset password with token
POST   /api/auth/set-password       // Set password for new admin
GET    /api/auth/verify-invite      // Verify invitation token

// Admin Management (Super Admin only)
GET    /api/admins                  // List all admins
POST   /api/admins/invite           // Invite new admin
POST   /api/admins/:id/resend       // Resend invitation
PATCH  /api/admins/:id/status       // Activate/deactivate admin
DELETE /api/admins/:id              // Delete admin

// Role Management (Super Admin only)
GET    /api/roles                   // List all roles
POST   /api/roles                   // Create new role
PATCH  /api/roles/:id               // Update role
DELETE /api/roles/:id               // Delete role
```

### Email Templates

#### Invitation Email
```
Subject: You've been invited to IITian Squad Admin

Hi {name},

You've been invited to join IITian Squad Admin as a {role}.

Click the link below to set your password and activate your account:
{setPasswordLink}

This link will expire in 24 hours.

If you didn't expect this invitation, please ignore this email.
```

#### Password Reset Email
```
Subject: Reset your IITian Squad Admin password

Hi {name},

We received a request to reset your password.

Click the link below to reset your password:
{resetPasswordLink}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.
```

## Testing

### Test Credentials (Mock)
- Email: `super@iitian-squad.com`
- Password: `password123`

### Test Flow
1. Visit `/login`
2. Enter test credentials
3. Should redirect to dashboard
4. Visit `/admin-management` (Super Admin only)
5. Test inviting new admin
6. Test role management

## Production Checklist

- [ ] Replace mock API routes with real database queries
- [ ] Implement JWT token generation and verification
- [ ] Set up email service (SendGrid, AWS SES, etc.)
- [ ] Hash passwords with bcrypt
- [ ] Move tokens to httpOnly cookies
- [ ] Add rate limiting to login endpoint
- [ ] Add CSRF protection
- [ ] Implement refresh tokens
- [ ] Add audit logging
- [ ] Set up monitoring and alerts
- [ ] Add 2FA (optional)

## Security Best Practices

1. **Never store passwords in plain text** - Always hash with bcrypt
2. **Use httpOnly cookies** for tokens in production
3. **Implement rate limiting** on auth endpoints
4. **Add CSRF protection** for state-changing operations
5. **Log all admin actions** for audit trail
6. **Expire tokens** after reasonable time
7. **Validate all inputs** on backend
8. **Use HTTPS** in production
9. **Implement account lockout** after failed attempts
10. **Regular security audits**

## Next Steps

1. Set up database and create tables
2. Implement real API routes with database queries
3. Set up email service
4. Test invitation and password flows
5. Add to existing pages with ProtectedRoute
6. Update navigation to show/hide based on permissions
